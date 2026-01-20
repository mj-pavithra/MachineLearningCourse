import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import {
  Box,
  Heading,
  Text,
  HStack,
  VStack,
  Badge,
  IconButton,
  Field,
  Input,
  NativeSelect,
  SimpleGrid,
  Center,
  Checkbox,
  CheckboxGroup,
} from '@chakra-ui/react';
import { HiPlus, HiX, HiChevronDown, HiChevronUp, HiFilter } from 'react-icons/hi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fetchEquipment, createEquipment, updateEquipment, FetchEquipmentParams, EquipmentListResponse } from '@/services/api/equipment';
import { queryKeys } from '@/services/api/queryKeys';
import { useIsAdmin } from '@/hooks/useRequireAdmin';
import { useToast } from '@/utils/toast';
import { getErrorMessage } from '@/utils/error';
import { SearchInput } from '@/components/ui/SearchInput';
import { ModalForm } from '@/components/ui/ModalForm';
import { Pagination } from '@/components/ui/Pagination';
import { ModernButton } from '@/components/ui/ModernButton';
import { Equipment, EquipmentType, MuscleGroup, Location } from '@/types/equipment';
import { EquipmentCard } from './components/EquipmentCard';
import * as prefetchers from '@/routes/prefetchers';
import { useSearch } from '@/contexts/SearchContext';

// Form validation schema
const equipmentFormSchema = z.object({
  name: z.string().min(1, 'Equipment name is required').max(200),
  type: z.nativeEnum(EquipmentType, { required_error: 'Equipment type is required' }),
  muscleGroups: z.array(z.nativeEnum(MuscleGroup)).min(1, 'At least one muscle group is required'),
  brand: z.string().min(1, 'Brand is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  sku: z.string().max(100).optional().or(z.literal('')),
  serialNumber: z.string().max(100).optional().or(z.literal('')),
  locationRoom: z.string().max(100).optional().or(z.literal('')),
  locationZone: z.string().max(100).optional().or(z.literal('')),
  quantityTotal: z.number().int().min(1, 'Quantity must be at least 1'),
  maintenanceIntervalDays: z.number().int().min(1).optional().or(z.null()),
});

type EquipmentFormData = z.infer<typeof equipmentFormSchema>;

type StatusFilter = 'all' | 'available' | 'maintenance' | 'retired';
type TypeFilter = 'all' | EquipmentType;

export default function EquipmentPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const isAdmin = useIsAdmin();
  const { searchQuery, setSearchQuery } = useSearch();

  // State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [locationRoomFilter, setLocationRoomFilter] = useState<string>('');
  const [locationZoneFilter, setLocationZoneFilter] = useState<string>('');
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      name: '',
      type: EquipmentType.UNKNOWN,
      muscleGroups: [],
      brand: '',
      model: '',
      sku: '',
      serialNumber: '',
      locationRoom: '',
      locationZone: '',
      quantityTotal: 1,
      maintenanceIntervalDays: null,
    },
  });

  const selectedMuscleGroups = watch('muscleGroups');

  // Sanitize and validate search term
  const sanitizedSearch = useMemo(() => {
    if (!debouncedSearch) return undefined;
    const trimmed = debouncedSearch.trim();
    if (trimmed.length < 2) return undefined;
    return trimmed.replace(/\s+/g, ' ').replace(/[<>"']/g, '');
  }, [debouncedSearch]);

  // Build query params with filters
  const queryParams = useMemo((): FetchEquipmentParams => {
    const params: FetchEquipmentParams = {
      page,
      size: pageSize,
    };
    
    if (sanitizedSearch) {
      params.search = sanitizedSearch;
    }
    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }
    if (typeFilter !== 'all') {
      params.type = typeFilter;
    }
    if (locationRoomFilter) {
      params.locationRoom = locationRoomFilter;
    }
    if (locationZoneFilter) {
      params.locationZone = locationZoneFilter;
    }
    
    return params;
  }, [page, pageSize, sanitizedSearch, statusFilter, typeFilter, locationRoomFilter, locationZoneFilter]);

  // Fetch equipment list
  const { data: equipmentData, isLoading, refetch, isFetching } = useQuery<EquipmentListResponse>({
    queryKey: queryKeys.equipment.list(queryParams),
    queryFn: async () => {
      setIsSearching(true);
      try {
        const result = await fetchEquipment(queryParams);
        return result;
      } finally {
        setIsSearching(false);
      }
    },
    staleTime: 60000, // 1 minute
    placeholderData: (previousData) => previousData,
  });

  // Check if we should show loading skeleton
  const showLoadingSkeleton = isLoading && (equipmentData === undefined || (equipmentData as EquipmentListResponse | undefined)?.items?.length === 0);

  // Track search state
  useEffect(() => {
    if (isFetching && sanitizedSearch) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [isFetching, sanitizedSearch]);

  // Client-side search function
  const performClientSideSearch = useCallback((equipment: Equipment[], searchTerm: string): Equipment[] => {
    if (!searchTerm || searchTerm.length < 2) return equipment;
    
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const searchTerms = normalizedSearch.split(/\s+/).filter(term => term.length > 0);
    
    return equipment.filter((eq) => {
      const name = eq.name?.toLowerCase() || '';
      const brand = eq.brand?.toLowerCase() || '';
      const model = eq.model?.toLowerCase() || '';
      const equipmentId = eq.equipmentId?.toLowerCase() || '';
      const sku = eq.sku?.toLowerCase() || '';
      
      const searchableText = `${name} ${brand} ${model} ${equipmentId} ${sku}`.toLowerCase();
      
      return searchTerms.every(term => searchableText.includes(term));
    });
  }, []);

  // Filtered and searched equipment
  const filteredEquipment = useMemo(() => {
    let filtered = equipmentData?.items || [];

    // Apply client-side search if we have a search term
    if (sanitizedSearch) {
      filtered = performClientSideSearch(filtered, sanitizedSearch);
    }

    // Status filter (already applied via API, but keep for client-side filtering if needed)
    if (statusFilter !== 'all') {
      filtered = filtered.filter((eq: Equipment) => {
        const status = eq.status || eq.equipmentStatus;
        return status === statusFilter;
      });
    }

    // Type filter (already applied via API, but keep for client-side filtering if needed)
    if (typeFilter !== 'all') {
      filtered = filtered.filter((eq: Equipment) => {
        const type = eq.type || eq.equipmentType;
        return type === typeFilter;
      });
    }

    // Location filters (already applied via API, but keep for client-side filtering if needed)
    if (locationRoomFilter) {
      filtered = filtered.filter((eq: Equipment) => {
        return eq.location?.room?.toLowerCase().includes(locationRoomFilter.toLowerCase());
      });
    }

    if (locationZoneFilter) {
      filtered = filtered.filter((eq: Equipment) => {
        return eq.location?.zone?.toLowerCase().includes(locationZoneFilter.toLowerCase());
      });
    }

    return filtered;
  }, [equipmentData?.items, sanitizedSearch, performClientSideSearch, statusFilter, typeFilter, locationRoomFilter, locationZoneFilter]);

  // Calculate pagination
  const filteredTotal = filteredEquipment.length;
  const filteredTotalPages = Math.ceil(filteredTotal / pageSize);
  const paginatedEquipment = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredEquipment.slice(start, end);
  }, [filteredEquipment, page, pageSize]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (typeFilter !== 'all') count++;
    if (locationRoomFilter) count++;
    if (locationZoneFilter) count++;
    return count;
  }, [statusFilter, typeFilter, locationRoomFilter, locationZoneFilter]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setStatusFilter('all');
    setTypeFilter('all');
    setLocationRoomFilter('');
    setLocationZoneFilter('');
    setPage(1);
  }, []);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: EquipmentFormData) => {
      const payload = {
        name: data.name,
        type: data.type,
        muscleGroups: data.muscleGroups,
        brand: data.brand,
        model: data.model,
        sku: data.sku || undefined,
        serialNumber: data.serialNumber || undefined,
        location: {
          room: data.locationRoom || undefined,
          zone: data.locationZone || undefined,
        } as Location,
        quantityTotal: data.quantityTotal,
        maintenanceIntervalDays: data.maintenanceIntervalDays || undefined,
      };
      return createEquipment(payload);
    },
    onSuccess: () => {
      toast.create({
        title: 'Success',
        description: 'Equipment created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsCreateModalOpen(false);
      reset();
      qc.invalidateQueries({ queryKey: queryKeys.equipment.all });
      refetch();
    },
    onError: (error) => {
      toast.create({
        title: 'Error',
        description: getErrorMessage(error),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EquipmentFormData }) => {
      const payload = {
        name: data.name,
        type: data.type,
        muscleGroups: data.muscleGroups,
        brand: data.brand,
        model: data.model,
        sku: data.sku || undefined,
        serialNumber: data.serialNumber || undefined,
        location: {
          room: data.locationRoom || undefined,
          zone: data.locationZone || undefined,
        } as Location,
        quantityTotal: data.quantityTotal,
        maintenanceIntervalDays: data.maintenanceIntervalDays || undefined,
      };
      return updateEquipment(id, payload);
    },
    onSuccess: () => {
      toast.create({
        title: 'Success',
        description: 'Equipment updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsEditModalOpen(false);
      setSelectedEquipment(null);
      reset();
      qc.invalidateQueries({ queryKey: queryKeys.equipment.all });
      refetch();
    },
    onError: (error) => {
      toast.create({
        title: 'Error',
        description: getErrorMessage(error),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });


  useEffect(() => {
    document.title = 'Equipment • PayZhe';
    prefetchers.prefetchEquipment(qc);
  }, [qc]);

  // Handle search debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setIsSearching(true);
  }, [setSearchQuery]);

  const handleDebouncedSearchChange = useCallback((value: string) => {
    setDebouncedSearch(value);
    setIsSearching(false);
    setPage(1); // Reset to first page on search
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, locationRoomFilter, locationZoneFilter]);

  // Handle create form submit
  const handleCreateSubmit = async (data: EquipmentFormData) => {
    await createMutation.mutateAsync(data);
  };

  // Handle edit form submit
  const handleEditSubmit = async (data: EquipmentFormData) => {
    if (selectedEquipment) {
      const id = selectedEquipment._id || selectedEquipment.equipmentId;
      await updateMutation.mutateAsync({ id, data });
    }
  };

  // Open edit modal
  const handleEdit = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setValue('name', equipment.name);
    setValue('type', equipment.type || equipment.equipmentType || EquipmentType.UNKNOWN);
    setValue('muscleGroups', equipment.muscleGroups || []);
    setValue('brand', equipment.brand);
    setValue('model', equipment.model);
    setValue('sku', equipment.sku || '');
    setValue('serialNumber', equipment.serialNumber || '');
    setValue('locationRoom', equipment.location?.room || '');
    setValue('locationZone', equipment.location?.zone || '');
    setValue('quantityTotal', equipment.quantityTotal);
    setValue('maintenanceIntervalDays', equipment.maintenanceIntervalDays || null);
    setIsEditModalOpen(true);
    setActionMenuOpen(null);
  };


  // Get all equipment type options
  const equipmentTypeOptions = Object.values(EquipmentType);

  // Get all muscle group options
  const muscleGroupOptions = Object.values(MuscleGroup);

  return (
    <Box px={{ base: 3, md: 6, lg: 8 }} py={{ base: 3, md: 6, lg: 8 }}>
      {/* Header */}
      <HStack justify="space-between" align="center" mb={{ base: 4, md: 5, lg: 6 }} flexWrap="wrap" gap={{ base: 3, md: 4 }}>
        <Box>
          <Heading size={{ base: 'xl', md: '2xl' }} mb={{ base: 1, md: 2 }}>
            Equipment
          </Heading>
          <Text color="gray.600" fontSize="sm">
            Manage gym equipment and inventory
          </Text>
        </Box>
        <ModernButton
          colorPalette="blue"
          onClick={() => {
            reset();
            setIsCreateModalOpen(true);
          }}
          disabled={!isAdmin}
          aria-label="Add Equipment"
        >
          <HiPlus />
          Add Equipment
        </ModernButton>
      </HStack>

      {/* Toolbar with Search */}
      <Box mb={{ base: 4, md: 5, lg: 6 }}>
        <HStack gap={{ base: 2, md: 4 }} align="center" flexWrap="wrap" w="full">
          <Box flex={1} minW={{ base: 'auto', sm: '250px' }} maxW="600px" w="full">
            <SearchInput
              ref={searchInputRef}
              value={searchQuery}
              onChange={handleSearchChange}
              onDebouncedChange={handleDebouncedSearchChange}
              placeholder="Search by name, brand, model, equipment ID, or SKU..."
              debounceDelay={400}
              isLoading={isSearching || isLoading}
              minLength={2}
            />
          </Box>
          {sanitizedSearch && (
            <HStack gap={2}>
              <Text fontSize="sm" color="gray.600">
                Searching for: <Text as="span" fontWeight="semibold" color="gray.900">"{sanitizedSearch}"</Text>
              </Text>
              <ModernButton
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearch('');
                }}
                aria-label="Clear search"
              >
                <HiX />
                Clear
              </ModernButton>
            </HStack>
          )}
        </HStack>
      </Box>

      {/* Comprehensive Filters - Collapsible */}
      <Box mb={{ base: 4, md: 5, lg: 6 }} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
        {/* Filter Header - Always Visible */}
        <Box
          p={{ base: 3, md: 4 }}
          cursor="pointer"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          _hover={{ bg: 'gray.100' }}
          transition="background-color 0.2s"
        >
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
            <HStack gap={2}>
              <HiFilter />
              <Text fontSize="md" fontWeight="semibold" color="gray.900">
                Filters
              </Text>
              {activeFilterCount > 0 && (
                <Badge colorPalette="blue" variant="solid">
                  {activeFilterCount} active
                </Badge>
              )}
            </HStack>
            <HStack gap={2}>
              {activeFilterCount > 0 && (
                <ModernButton
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFilters();
                  }}
                  aria-label="Clear all filters"
                >
                  <HiX />
                  Clear All
                </ModernButton>
              )}
              <IconButton
                variant="ghost"
                size="sm"
                aria-label={isFiltersOpen ? 'Collapse filters' : 'Expand filters'}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFiltersOpen(!isFiltersOpen);
                }}
              >
                {isFiltersOpen ? <HiChevronUp /> : <HiChevronDown />}
              </IconButton>
            </HStack>
          </HStack>
        </Box>

        {/* Filter Content - Collapsible */}
        {isFiltersOpen && (
          <Box p={{ base: 3, md: 4 }} pt={0} borderTopWidth="1px" borderColor="gray.200">
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={{ base: 3, md: 4 }}>
              {/* Status Filter */}
              <Field.Root>
                <Field.Label>Status</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  >
                    <option value="all">All Status</option>
                    <option value="available">Available</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>

              {/* Type Filter */}
              <Field.Root>
                <Field.Label>Equipment Type</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                  >
                    <option value="all">All Types</option>
                    {equipmentTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>

              {/* Location Room Filter */}
              <Field.Root>
                <Field.Label>Location Room</Field.Label>
                <Input
                  value={locationRoomFilter}
                  onChange={(e) => setLocationRoomFilter(e.target.value)}
                  placeholder="Filter by room"
                />
              </Field.Root>

              {/* Location Zone Filter */}
              <Field.Root>
                <Field.Label>Location Zone</Field.Label>
                <Input
                  value={locationZoneFilter}
                  onChange={(e) => setLocationZoneFilter(e.target.value)}
                  placeholder="Filter by zone"
                />
              </Field.Root>
            </SimpleGrid>
          </Box>
        )}
      </Box>

      {/* Search Results Header */}
      {sanitizedSearch && (
        <Box mb={4}>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
            <Text fontSize="sm" color="gray.600">
              {isSearching ? (
                <HStack gap={2}>
                  <Box
                    as="span"
                    display="inline-block"
                    width="12px"
                    height="12px"
                    border="2px solid"
                    borderColor="blue.500"
                    borderTopColor="transparent"
                    borderRadius="full"
                    style={{ animation: 'spin 0.6s linear infinite' }}
                  />
                  <Text>Searching...</Text>
                </HStack>
              ) : (
                <>
                  Found <Text as="span" fontWeight="semibold" color="gray.900">{filteredTotal}</Text> equipment{filteredTotal !== 1 ? 's' : ''} matching &quot;<Text as="span" fontWeight="semibold" color="gray.900">{sanitizedSearch}</Text>&quot;
                </>
              )}
            </Text>
          </HStack>
        </Box>
      )}

      {/* Equipment Cards Grid */}
      <Box mb={6}>
        {showLoadingSkeleton ? (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={4}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <EquipmentCard key={i} equipment={{} as Equipment} isLoading={true} />
            ))}
          </SimpleGrid>
        ) : paginatedEquipment.length === 0 ? (
          <Center py={12}>
            <VStack gap={3}>
              <Text fontSize="lg" color="gray.500" fontWeight="medium">
                {sanitizedSearch ? (
                  <>No equipment found matching &quot;<Text as="span" fontWeight="semibold" color="gray.900">{sanitizedSearch}</Text>&quot;</>
                ) : (
                  'No equipment found'
                )}
              </Text>
              <HStack gap={2}>
                {sanitizedSearch && (
                  <ModernButton size="sm" variant="ghost" onClick={() => {
                    setSearchQuery('');
                    setDebouncedSearch('');
                  }}>
                    Clear search
                  </ModernButton>
                )}
                {activeFilterCount > 0 && (
                  <ModernButton size="sm" variant="ghost" onClick={clearFilters}>
                    Clear filters
                  </ModernButton>
                )}
                {!sanitizedSearch && activeFilterCount === 0 && (
                  <Text fontSize="sm" color="gray.500">
                    Try adjusting your search or filters
                  </Text>
                )}
              </HStack>
            </VStack>
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={4}>
            {paginatedEquipment.map((equipment: Equipment) => (
              <EquipmentCard
                key={equipment._id || equipment.equipmentId}
                equipment={equipment}
                onEdit={handleEdit}
                actionMenuOpen={actionMenuOpen}
                onActionMenuChange={setActionMenuOpen}
              />
            ))}
          </SimpleGrid>
        )}
      </Box>

      {/* Pagination */}
      {filteredTotal > 0 && (
        <Pagination
          currentPage={page}
          totalPages={filteredTotalPages}
          totalItems={filteredTotal}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          showPageSizeSelector={true}
        />
      )}

      {/* Create Modal */}
      <ModalForm
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          reset();
        }}
        onSubmit={handleSubmit(handleCreateSubmit)}
        title="Add Equipment"
        submitLabel="Create"
        isLoading={isSubmitting || createMutation.isPending}
        isDisabled={isSubmitting || createMutation.isPending}
        size="lg"
      >
        <VStack gap={{ base: 4, md: 5 }} align="stretch">
          {/* Section 1: Basic Information */}
          <Box
            bg="gray.50"
            borderRadius="md"
            p={{ base: 4, md: 5 }}
            borderWidth="1px"
            borderColor="gray.200"
          >
            <Heading
              fontSize="md"
              fontWeight="semibold"
              color="gray.700"
              mb={3}
            >
              Basic Information
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: 3, md: 4 }}>
              {/* Name */}
              <Field.Root invalid={!!errors.name}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Equipment Name
                </Field.Label>
                <Input
                  {...register('name')}
                  placeholder="e.g., Olympic Barbell Set"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.name && (
                  <Field.ErrorText id="name-error">{errors.name.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* Type */}
              <Field.Root invalid={!!errors.type}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Equipment Type
                </Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    {...register('type')}
                    aria-invalid={!!errors.type}
                    aria-describedby={errors.type ? 'type-error' : undefined}
                    borderRadius="xl"
                    borderWidth="2px"
                    borderColor="gray.200"
                    bg="white"
                    minH={{ base: '48px', md: '52px' }}
                    fontSize={{ base: '16px', md: 'md' }}
                    _hover={{ borderColor: 'gray.300' }}
                    _focus={{
                      borderColor: 'blue.500',
                      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                    }}
                    _invalid={{ borderColor: 'red.500' }}
                  >
                    <option value="">Select type</option>
                    {equipmentTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
                {errors.type && (
                  <Field.ErrorText id="type-error">{errors.type.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* Muscle Groups - Full Width */}
              <Box gridColumn={{ base: '1', md: '1 / -1' }}>
                <Field.Root invalid={!!errors.muscleGroups}>
                  <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                    Muscle Groups (Select at least one)
                  </Field.Label>
                  <CheckboxGroup
                    value={selectedMuscleGroups}
                    onValueChange={(value: string[]) => setValue('muscleGroups', value as MuscleGroup[])}
                  >
                    <style>{`
                      .muscle-groups-scrollbar::-webkit-scrollbar {
                        width: 8px;
                      }
                      .muscle-groups-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                      }
                      .muscle-groups-scrollbar::-webkit-scrollbar-thumb {
                        background: #CBD5E0;
                        border-radius: 4px;
                      }
                      .muscle-groups-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #A0AEC0;
                      }
                    `}</style>
                    <Box
                      maxH="200px"
                      overflowY="auto"
                      p={3}
                      borderWidth="2px"
                      borderColor="gray.200"
                      borderRadius="xl"
                      bg="white"
                      className="muscle-groups-scrollbar"
                    >
                      <VStack align="stretch" gap={2}>
                        {muscleGroupOptions.map((group) => (
                          <Checkbox.Root
                            key={group}
                            value={group}
                            _hover={{ bg: 'gray.50' }}
                            p={2}
                            borderRadius="md"
                            transition="background-color 0.2s"
                          >
                            <Checkbox.Control />
                            <Checkbox.Label fontSize={{ base: 'sm', md: 'md' }}>
                              {group.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </Checkbox.Label>
                          </Checkbox.Root>
                        ))}
                      </VStack>
                    </Box>
                  </CheckboxGroup>
                  {errors.muscleGroups && (
                    <Field.ErrorText id="muscleGroups-error">{errors.muscleGroups.message}</Field.ErrorText>
                  )}
                </Field.Root>
              </Box>
            </SimpleGrid>
          </Box>

          {/* Section 2: Product Details */}
          <Box
            bg="gray.50"
            borderRadius="md"
            p={{ base: 4, md: 5 }}
            borderWidth="1px"
            borderColor="gray.200"
          >
            <Heading
              fontSize="md"
              fontWeight="semibold"
              color="gray.700"
              mb={3}
            >
              Product Details
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: 3, md: 4 }}>
              {/* Brand */}
              <Field.Root invalid={!!errors.brand}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Brand
                </Field.Label>
                <Input
                  {...register('brand')}
                  placeholder="e.g., Rogue Fitness"
                  aria-invalid={!!errors.brand}
                  aria-describedby={errors.brand ? 'brand-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.brand && (
                  <Field.ErrorText id="brand-error">{errors.brand.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* Model */}
              <Field.Root invalid={!!errors.model}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Model
                </Field.Label>
                <Input
                  {...register('model')}
                  placeholder="e.g., Ohio Bar"
                  aria-invalid={!!errors.model}
                  aria-describedby={errors.model ? 'model-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.model && (
                  <Field.ErrorText id="model-error">{errors.model.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* SKU */}
              <Field.Root invalid={!!errors.sku}>
                <Field.Label fontWeight="semibold" color="gray.600" mb={2.5}>
                  SKU (Optional)
                </Field.Label>
                <Input
                  {...register('sku')}
                  placeholder="Stock keeping unit"
                  aria-invalid={!!errors.sku}
                  aria-describedby={errors.sku ? 'sku-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.sku && (
                  <Field.ErrorText id="sku-error">{errors.sku.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* Serial Number */}
              <Field.Root invalid={!!errors.serialNumber}>
                <Field.Label fontWeight="semibold" color="gray.600" mb={2.5}>
                  Serial Number (Optional)
                </Field.Label>
                <Input
                  {...register('serialNumber')}
                  placeholder="Serial number"
                  aria-invalid={!!errors.serialNumber}
                  aria-describedby={errors.serialNumber ? 'serialNumber-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.serialNumber && (
                  <Field.ErrorText id="serialNumber-error">{errors.serialNumber.message}</Field.ErrorText>
                )}
              </Field.Root>
            </SimpleGrid>
          </Box>

          {/* Section 3: Location & Inventory */}
          <Box
            bg="gray.50"
            borderRadius="md"
            p={{ base: 4, md: 5 }}
            borderWidth="1px"
            borderColor="gray.200"
          >
            <Heading
              fontSize="md"
              fontWeight="semibold"
              color="gray.700"
              mb={3}
            >
              Location & Inventory
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: 3, md: 4 }}>
              {/* Location Room */}
              <Field.Root invalid={!!errors.locationRoom}>
                <Field.Label fontWeight="semibold" color="gray.600" mb={2.5}>
                  Location Room (Optional)
                </Field.Label>
                <Input
                  {...register('locationRoom')}
                  placeholder="e.g., Main Floor"
                  aria-invalid={!!errors.locationRoom}
                  aria-describedby={errors.locationRoom ? 'locationRoom-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.locationRoom && (
                  <Field.ErrorText id="locationRoom-error">{errors.locationRoom.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* Location Zone */}
              <Field.Root invalid={!!errors.locationZone}>
                <Field.Label fontWeight="semibold" color="gray.600" mb={2.5}>
                  Location Zone (Optional)
                </Field.Label>
                <Input
                  {...register('locationZone')}
                  placeholder="e.g., Zone A"
                  aria-invalid={!!errors.locationZone}
                  aria-describedby={errors.locationZone ? 'locationZone-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.locationZone && (
                  <Field.ErrorText id="locationZone-error">{errors.locationZone.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* Quantity Total */}
              <Field.Root invalid={!!errors.quantityTotal}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Total Quantity
                </Field.Label>
                <Input
                  type="number"
                  {...register('quantityTotal', { valueAsNumber: true })}
                  placeholder="1"
                  min={1}
                  aria-invalid={!!errors.quantityTotal}
                  aria-describedby={errors.quantityTotal ? 'quantityTotal-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.quantityTotal && (
                  <Field.ErrorText id="quantityTotal-error">{errors.quantityTotal.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* Maintenance Interval Days */}
              <Field.Root invalid={!!errors.maintenanceIntervalDays}>
                <Field.Label fontWeight="semibold" color="gray.600" mb={2.5}>
                  Maintenance Interval (Days, Optional)
                </Field.Label>
                <Input
                  type="number"
                  {...register('maintenanceIntervalDays', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })}
                  placeholder="e.g., 90"
                  min={1}
                  aria-invalid={!!errors.maintenanceIntervalDays}
                  aria-describedby={errors.maintenanceIntervalDays ? 'maintenanceIntervalDays-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.maintenanceIntervalDays && (
                  <Field.ErrorText id="maintenanceIntervalDays-error">{errors.maintenanceIntervalDays.message}</Field.ErrorText>
                )}
              </Field.Root>
            </SimpleGrid>
          </Box>
        </VStack>
      </ModalForm>

      {/* Edit Modal */}
      <ModalForm
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEquipment(null);
          reset();
        }}
        onSubmit={handleSubmit(handleEditSubmit)}
        title="Edit Equipment"
        submitLabel="Save"
        isLoading={isSubmitting || updateMutation.isPending}
        isDisabled={isSubmitting || updateMutation.isPending}
        size="lg"
      >
        <VStack gap={4} align="stretch">
          {/* Name */}
          <Field.Root invalid={!!errors.name}>
            <Field.Label>Equipment Name</Field.Label>
            <Input
              {...register('name')}
              placeholder="e.g., Olympic Barbell Set"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <Field.ErrorText id="name-error">{errors.name.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Type */}
          <Field.Root invalid={!!errors.type}>
            <Field.Label>Equipment Type</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                {...register('type')}
                aria-invalid={!!errors.type}
                aria-describedby={errors.type ? 'type-error' : undefined}
              >
                <option value="">Select type</option>
                {equipmentTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
            {errors.type && (
              <Field.ErrorText id="type-error">{errors.type.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Muscle Groups */}
          <Field.Root invalid={!!errors.muscleGroups}>
            <Field.Label>Muscle Groups (Select at least one)</Field.Label>
            <CheckboxGroup
              value={selectedMuscleGroups}
              onValueChange={(value: string[]) => setValue('muscleGroups', value as MuscleGroup[])}
            >
              <VStack align="stretch" gap={2} maxH="200px" overflowY="auto" p={2} borderWidth="1px" borderRadius="md">
                {muscleGroupOptions.map((group) => (
                  <Checkbox.Root key={group} value={group}>
                    <Checkbox.Control />
                    <Checkbox.Label>
                      {group.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </Checkbox.Label>
                  </Checkbox.Root>
                ))}
              </VStack>
            </CheckboxGroup>
            {errors.muscleGroups && (
              <Field.ErrorText id="muscleGroups-error">{errors.muscleGroups.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Brand */}
          <Field.Root invalid={!!errors.brand}>
            <Field.Label>Brand</Field.Label>
            <Input
              {...register('brand')}
              placeholder="e.g., Rogue Fitness"
              aria-invalid={!!errors.brand}
              aria-describedby={errors.brand ? 'brand-error' : undefined}
            />
            {errors.brand && (
              <Field.ErrorText id="brand-error">{errors.brand.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Model */}
          <Field.Root invalid={!!errors.model}>
            <Field.Label>Model</Field.Label>
            <Input
              {...register('model')}
              placeholder="e.g., Ohio Bar"
              aria-invalid={!!errors.model}
              aria-describedby={errors.model ? 'model-error' : undefined}
            />
            {errors.model && (
              <Field.ErrorText id="model-error">{errors.model.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* SKU */}
          <Field.Root invalid={!!errors.sku}>
            <Field.Label>SKU (Optional)</Field.Label>
            <Input
              {...register('sku')}
              placeholder="Stock keeping unit"
              aria-invalid={!!errors.sku}
              aria-describedby={errors.sku ? 'sku-error' : undefined}
            />
            {errors.sku && (
              <Field.ErrorText id="sku-error">{errors.sku.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Serial Number */}
          <Field.Root invalid={!!errors.serialNumber}>
            <Field.Label>Serial Number (Optional)</Field.Label>
            <Input
              {...register('serialNumber')}
              placeholder="Serial number"
              aria-invalid={!!errors.serialNumber}
              aria-describedby={errors.serialNumber ? 'serialNumber-error' : undefined}
            />
            {errors.serialNumber && (
              <Field.ErrorText id="serialNumber-error">{errors.serialNumber.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Location Room */}
          <Field.Root invalid={!!errors.locationRoom}>
            <Field.Label>Location Room (Optional)</Field.Label>
            <Input
              {...register('locationRoom')}
              placeholder="e.g., Main Floor"
              aria-invalid={!!errors.locationRoom}
              aria-describedby={errors.locationRoom ? 'locationRoom-error' : undefined}
            />
            {errors.locationRoom && (
              <Field.ErrorText id="locationRoom-error">{errors.locationRoom.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Location Zone */}
          <Field.Root invalid={!!errors.locationZone}>
            <Field.Label>Location Zone (Optional)</Field.Label>
            <Input
              {...register('locationZone')}
              placeholder="e.g., Zone A"
              aria-invalid={!!errors.locationZone}
              aria-describedby={errors.locationZone ? 'locationZone-error' : undefined}
            />
            {errors.locationZone && (
              <Field.ErrorText id="locationZone-error">{errors.locationZone.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Quantity Total */}
          <Field.Root invalid={!!errors.quantityTotal}>
            <Field.Label>Total Quantity</Field.Label>
            <Input
              type="number"
              {...register('quantityTotal', { valueAsNumber: true })}
              placeholder="1"
              min={1}
              aria-invalid={!!errors.quantityTotal}
              aria-describedby={errors.quantityTotal ? 'quantityTotal-error' : undefined}
            />
            {errors.quantityTotal && (
              <Field.ErrorText id="quantityTotal-error">{errors.quantityTotal.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Maintenance Interval Days */}
          <Field.Root invalid={!!errors.maintenanceIntervalDays}>
            <Field.Label>Maintenance Interval (Days, Optional)</Field.Label>
            <Input
              type="number"
              {...register('maintenanceIntervalDays', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })}
              placeholder="e.g., 90"
              min={1}
              aria-invalid={!!errors.maintenanceIntervalDays}
              aria-describedby={errors.maintenanceIntervalDays ? 'maintenanceIntervalDays-error' : undefined}
            />
            {errors.maintenanceIntervalDays && (
              <Field.ErrorText id="maintenanceIntervalDays-error">{errors.maintenanceIntervalDays.message}</Field.ErrorText>
            )}
          </Field.Root>
        </VStack>
      </ModalForm>

    </Box>
  );
}

