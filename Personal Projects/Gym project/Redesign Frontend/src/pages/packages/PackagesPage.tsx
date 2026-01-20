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
  Textarea,
  SimpleGrid,
  Switch,
  Center,
} from '@chakra-ui/react';
import { HiPlus, HiX, HiChevronDown, HiChevronUp, HiFilter, HiDownload } from 'react-icons/hi';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fetchPackages, createPackage, updatePackage } from '@/services/api/packages';
import { queryKeys } from '@/services/api/queryKeys';
import { useIsAdmin } from '@/hooks/useRequireAdmin';
import { useToast } from '@/utils/toast';
import { getErrorMessage } from '@/utils/error';
import { exportToCSV } from '@/utils/export';
import { SearchInput } from '@/components/ui/SearchInput';
import { ModalForm } from '@/components/ui/ModalForm';
import { Pagination } from '@/components/ui/Pagination';
import { ModernButton } from '@/components/ui/ModernButton';
import { Package } from '@/types/package';
import { PackageCard } from './components/PackageCard';
import * as prefetchers from '@/routes/prefetchers';
import { useSearch } from '@/contexts/SearchContext';

// Form validation schema (adapted from input-validators)
const packageFormSchema = z.object({
  name: z.string().min(1, 'Package name is required').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  durationDays: z.number().int().min(1, 'Duration must be at least 1 day'),
  price: z.number().min(0, 'Price must be non-negative'),
  sessions: z.number().int().min(1, 'Sessions must be at least 1').optional(),
  isUnlimited: z.boolean().optional(),
  isActive: z.boolean(),
  isGroup: z.boolean(),
  isVisible: z.boolean(),
});

type PackageFormData = z.infer<typeof packageFormSchema>;

type PackageTypeFilter = 'all' | 'monthly' | 'quarterly' | 'annual' | 'custom';
type StatusFilter = 'all' | 'active' | 'inactive';
type GroupFilter = 'all' | 'individual' | 'group';

export default function PackagesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const isAdmin = useIsAdmin();
  const { searchQuery, setSearchQuery } = useSearch();

  // State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<PackageTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all');
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
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
  } = useForm<PackageFormData>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      name: '',
      description: '',
      durationDays: 30,
      price: 0,
      sessions: 10,
      isUnlimited: false,
      isActive: true,
      isGroup: false,
      isVisible: true,
    },
  });

  const isUnlimited = watch('isUnlimited');

  // Fetch packages
  const { data: packages = [], isLoading, refetch } = useQuery({
    queryKey: queryKeys.packages.list(),
    queryFn: fetchPackages,
    staleTime: 60000, // 1 minute
  });

  // Sanitize and validate search term
  const sanitizedSearch = useMemo(() => {
    if (!debouncedSearch) return undefined;
    const trimmed = debouncedSearch.trim();
    if (trimmed.length < 2) return undefined;
    return trimmed;
  }, [debouncedSearch]);

  // Filtered and searched packages
  const filteredPackages = useMemo(() => {
    let filtered = [...packages];

    // Search filter
    if (sanitizedSearch) {
      const searchLower = sanitizedSearch.toLowerCase();
      filtered = filtered.filter(
        (pkg) =>
          (pkg.package_name || pkg.name || '').toLowerCase().includes(searchLower) ||
          (pkg.description && pkg.description.toLowerCase().includes(searchLower)) ||
          (pkg.packageId && pkg.packageId.toLowerCase().includes(searchLower))
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((pkg) => {
        const days = pkg.durationDays;
        switch (typeFilter) {
          case 'monthly':
            return days >= 25 && days <= 35;
          case 'quarterly':
            return days >= 85 && days <= 95;
          case 'annual':
            return days >= 360 && days <= 370;
          case 'custom':
            return days < 25 || (days > 35 && days < 85) || (days > 95 && days < 360) || days > 370;
          default:
            return true;
        }
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((pkg) => {
        if (statusFilter === 'active') return pkg.isActive;
        if (statusFilter === 'inactive') return !pkg.isActive;
        return true;
      });
    }

    // Group filter
    if (groupFilter !== 'all') {
      filtered = filtered.filter((pkg) => {
        if (groupFilter === 'group') return pkg.isGroup;
        if (groupFilter === 'individual') return !pkg.isGroup;
        return true;
      });
    }

    return filtered;
  }, [packages, sanitizedSearch, typeFilter, statusFilter, groupFilter]);

  // Pagination
  const filteredTotal = filteredPackages.length;
  const filteredTotalPages = Math.ceil(filteredTotal / pageSize);
  const paginatedPackages = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredPackages.slice(start, end);
  }, [filteredPackages, page, pageSize]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (typeFilter !== 'all') count++;
    if (groupFilter !== 'all') count++;
    return count;
  }, [statusFilter, typeFilter, groupFilter]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setStatusFilter('all');
    setTypeFilter('all');
    setGroupFilter('all');
    setPage(1);
  }, []);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: PackageFormData) => {
      // API expects 'name' field, not 'package_name'
      const payload: any = {
        name: data.name,
        description: data.description || '',
        durationDays: data.durationDays,
        price: data.price,
        sessions: data.isUnlimited ? 999999 : (data.sessions || 10),
        isActive: data.isActive,
        isGroup: data.isGroup,
        isVisible: data.isVisible,
      };
      return createPackage(payload);
    },
    onSuccess: () => {
      toast.create({
        title: 'Success',
        description: 'Package created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsCreateModalOpen(false);
      reset();
      qc.invalidateQueries({ queryKey: queryKeys.packages.all });
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
    mutationFn: ({ id, data }: { id: string; data: PackageFormData }) => {
      // API expects 'name' field, not 'package_name'
      const payload: any = {
        name: data.name,
        description: data.description || '',
        durationDays: data.durationDays,
        price: data.price,
        sessions: data.isUnlimited ? 999999 : (data.sessions || 10),
        isActive: data.isActive,
        isGroup: data.isGroup,
        isVisible: data.isVisible,
        updatedAt: new Date().toISOString(),
      };
      return updatePackage(id, payload);
    },
    onSuccess: () => {
      toast.create({
        title: 'Success',
        description: 'Package updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsEditModalOpen(false);
      setSelectedPackage(null);
      reset();
      qc.invalidateQueries({ queryKey: queryKeys.packages.all });
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
    document.title = 'Packages • PayZhe';
    prefetchers.prefetchPackages(qc);
  }, [qc]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, groupFilter]);

  // Handle search change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, [setSearchQuery]);

  const handleDebouncedSearchChange = useCallback((value: string) => {
    setDebouncedSearch(value);
    setPage(1);
  }, []);

  // Handle create form submit
  const handleCreateSubmit = async (data: PackageFormData) => {
    await createMutation.mutateAsync(data);
  };

  // Handle edit form submit
  const handleEditSubmit = async (data: PackageFormData) => {
    if (selectedPackage) {
      await updateMutation.mutateAsync({ id: selectedPackage.packageId, data });
    }
  };

  // Open edit modal
  const handleEdit = (pkg: Package) => {
    setSelectedPackage(pkg);
    setValue('name', pkg.package_name || pkg.name || '');
    setValue('description', pkg.description || '');
    setValue('durationDays', pkg.durationDays);
    setValue('price', pkg.price);
    setValue('sessions', pkg.sessions);
    setValue('isUnlimited', pkg.sessions >= 999999);
    setValue('isActive', pkg.isActive);
    setValue('isGroup', pkg.isGroup);
    setValue('isVisible', pkg.isVisible);
    setIsEditModalOpen(true);
    setActionMenuOpen(null);
  };


  // Handle export
  const handleExport = useCallback(() => {
    const exportData = filteredPackages.map((pkg) => ({
      Name: pkg.package_name || pkg.name || 'Unnamed',
      Description: pkg.description || '',
      Duration: `${pkg.durationDays} days`,
      Price: `$${pkg.price.toFixed(2)}`,
      Sessions: pkg.sessions >= 999999 ? 'Unlimited' : pkg.sessions.toString(),
      Status: pkg.isActive ? 'Active' : 'Inactive',
      Group: pkg.isGroup ? 'Yes' : 'No',
      Visible: pkg.isVisible ? 'Yes' : 'No',
      'Package ID': pkg.packageId || '-',
      'Created Date': pkg.createdAt ? format(new Date(pkg.createdAt), 'MMM dd, yyyy') : '-',
    }));

    try {
      exportToCSV(exportData, `packages-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      toast.create({
        title: 'Success',
        description: `Exported ${exportData.length} package(s) to CSV`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast.create({
        title: 'Error',
        description: getErrorMessage(error),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [filteredPackages, toast]);



  return (
    <Box px={{ base: 3, md: 6, lg: 8 }} py={{ base: 3, md: 6, lg: 8 }}>
      {/* Header */}
      <HStack justify="space-between" align="center" mb={{ base: 4, md: 5, lg: 6 }} flexWrap="wrap" gap={{ base: 3, md: 4 }}>
        <Box>
          <Heading size={{ base: 'xl', md: '2xl' }} mb={{ base: 1, md: 2 }}>
            Packages
          </Heading>
          <Text color="gray.600" fontSize="sm">
            Manage gym membership packages and pricing
          </Text>
        </Box>
        <HStack gap={2}>
          <ModernButton
            size="sm"
            variant="outline"
            onClick={handleExport}
          >
            <HiDownload />
            Export
          </ModernButton>
          <ModernButton
            colorPalette="blue"
            onClick={() => {
              reset();
              setIsCreateModalOpen(true);
            }}
            disabled={!isAdmin}
            aria-label="Add Package"
          >
            <HiPlus />
            Add Package
          </ModernButton>
        </HStack>
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
              placeholder="Search packages by name, description, or package ID..."
              debounceDelay={400}
              isLoading={isLoading}
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
          <Box p={4} pt={0} borderTopWidth="1px" borderColor="gray.200">
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={{ base: 3, md: 4 }}>
              {/* Status Filter */}
              <Field.Root>
                <Field.Label>Status</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>

              {/* Type Filter */}
              <Field.Root>
                <Field.Label>Package Type</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as PackageTypeFilter)}
                  >
                    <option value="all">All Types</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                    <option value="custom">Custom</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>

              {/* Group Filter */}
              <Field.Root>
                <Field.Label>Group Type</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value as GroupFilter)}
                  >
                    <option value="all">All</option>
                    <option value="individual">Individual</option>
                    <option value="group">Group</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>
            </SimpleGrid>
          </Box>
        )}
      </Box>

      {/* Search Results Header */}
      {sanitizedSearch && (
        <Box mb={{ base: 3, md: 4 }}>
          <Text fontSize="sm" color="gray.600">
            Found <Text as="span" fontWeight="semibold" color="gray.900">{filteredTotal}</Text> package{filteredTotal !== 1 ? 's' : ''} matching &quot;<Text as="span" fontWeight="semibold" color="gray.900">{sanitizedSearch}</Text>&quot;
          </Text>
        </Box>
      )}

      {/* Package Cards Grid */}
      <Box mb={6}>
        {isLoading && !packages.length ? (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={4}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <PackageCard key={i} package={{} as Package} isLoading={true} />
            ))}
          </SimpleGrid>
        ) : paginatedPackages.length === 0 ? (
          <Center py={12}>
            <VStack gap={3}>
              <Text fontSize="lg" color="gray.500" fontWeight="medium">
                {sanitizedSearch ? (
                  <>No packages found matching &quot;<Text as="span" fontWeight="semibold" color="gray.900">{sanitizedSearch}</Text>&quot;</>
                ) : (
                  'No packages found'
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
            {paginatedPackages.map((pkg) => (
              <PackageCard
                key={pkg._id || pkg.packageId}
                package={pkg}
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
        title="Add Package"
        submitLabel="Create"
        isLoading={isSubmitting || createMutation.isPending}
        isDisabled={isSubmitting || createMutation.isPending}
        size="lg"
      >
        <VStack gap={4} align="stretch">
          {/* Name */}
          <Field.Root invalid={!!errors.name}>
            <Field.Label>Package Name</Field.Label>
            <Input
              {...register('name')}
              placeholder="e.g., Monthly Membership"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <Field.ErrorText id="name-error">{errors.name.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Description */}
          <Field.Root invalid={!!errors.description}>
            <Field.Label>Description (Optional)</Field.Label>
            <Textarea
              {...register('description')}
              placeholder="Package description..."
              rows={3}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'description-error' : undefined}
            />
            {errors.description && (
              <Field.ErrorText id="description-error">{errors.description.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Duration */}
          <Field.Root invalid={!!errors.durationDays}>
            <Field.Label>Duration (Days)</Field.Label>
            <Input
              type="number"
              {...register('durationDays', { valueAsNumber: true })}
              placeholder="30"
              min={1}
              aria-invalid={!!errors.durationDays}
              aria-describedby={errors.durationDays ? 'durationDays-error' : undefined}
            />
            {errors.durationDays && (
              <Field.ErrorText id="durationDays-error">{errors.durationDays.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Price */}
          <Field.Root invalid={!!errors.price}>
            <Field.Label>Price</Field.Label>
            <Input
              type="number"
              {...register('price', { valueAsNumber: true })}
              placeholder="0.00"
              min={0}
              step="0.01"
              aria-invalid={!!errors.price}
              aria-describedby={errors.price ? 'price-error' : undefined}
            />
            {errors.price && (
              <Field.ErrorText id="price-error">{errors.price.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Sessions */}
          <Field.Root>
            <Field.Label>Sessions</Field.Label>
            <HStack gap={4}>
              <Switch.Root
                checked={isUnlimited}
                onCheckedChange={(e) => {
                  setValue('isUnlimited', e.checked);
                  if (e.checked) {
                    setValue('sessions', undefined);
                  }
                }}
              >
                <Switch.Control />
                <Switch.Label>Unlimited</Switch.Label>
              </Switch.Root>
              {!isUnlimited && (
                <Box flex={1}>
                  <Input
                    type="number"
                    {...register('sessions', { valueAsNumber: true })}
                    placeholder="10"
                    min={1}
                    aria-invalid={!!errors.sessions}
                    aria-describedby={errors.sessions ? 'sessions-error' : undefined}
                  />
                  {errors.sessions && (
                    <Field.ErrorText id="sessions-error">{errors.sessions.message}</Field.ErrorText>
                  )}
                </Box>
              )}
            </HStack>
          </Field.Root>

          {/* Is Active */}
          <Field.Root>
            <HStack justify="space-between">
              <Field.Label>Active</Field.Label>
              <Switch.Root
                checked={watch('isActive')}
                onCheckedChange={(e) => setValue('isActive', e.checked)}
              >
                <Switch.Control />
              </Switch.Root>
            </HStack>
          </Field.Root>

          {/* Is Group */}
          <Field.Root>
            <HStack justify="space-between">
              <Field.Label>Group Package</Field.Label>
              <Switch.Root
                checked={watch('isGroup')}
                onCheckedChange={(e) => setValue('isGroup', e.checked)}
              >
                <Switch.Control />
              </Switch.Root>
            </HStack>
          </Field.Root>

          {/* Is Visible */}
          <Field.Root>
            <HStack justify="space-between">
              <Field.Label>Visible</Field.Label>
              <Switch.Root
                checked={watch('isVisible')}
                onCheckedChange={(e) => setValue('isVisible', e.checked)}
              >
                <Switch.Control />
              </Switch.Root>
            </HStack>
          </Field.Root>
        </VStack>
      </ModalForm>

      {/* Edit Modal */}
      <ModalForm
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPackage(null);
          reset();
        }}
        onSubmit={handleSubmit(handleEditSubmit)}
        title="Edit Package"
        submitLabel="Save"
        isLoading={isSubmitting || updateMutation.isPending}
        isDisabled={isSubmitting || updateMutation.isPending}
        size="lg"
      >
        <VStack gap={4} align="stretch">
          {/* Name */}
          <Field.Root invalid={!!errors.name}>
            <Field.Label>Package Name</Field.Label>
            <Input
              {...register('name')}
              placeholder="e.g., Monthly Membership"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <Field.ErrorText id="name-error">{errors.name.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Description */}
          <Field.Root invalid={!!errors.description}>
            <Field.Label>Description (Optional)</Field.Label>
            <Textarea
              {...register('description')}
              placeholder="Package description..."
              rows={3}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'description-error' : undefined}
            />
            {errors.description && (
              <Field.ErrorText id="description-error">{errors.description.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Duration */}
          <Field.Root invalid={!!errors.durationDays}>
            <Field.Label>Duration (Days)</Field.Label>
            <Input
              type="number"
              {...register('durationDays', { valueAsNumber: true })}
              placeholder="30"
              min={1}
              aria-invalid={!!errors.durationDays}
              aria-describedby={errors.durationDays ? 'durationDays-error' : undefined}
            />
            {errors.durationDays && (
              <Field.ErrorText id="durationDays-error">{errors.durationDays.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Price */}
          <Field.Root invalid={!!errors.price}>
            <Field.Label>Price</Field.Label>
            <Input
              type="number"
              {...register('price', { valueAsNumber: true })}
              placeholder="0.00"
              min={0}
              step="0.01"
              aria-invalid={!!errors.price}
              aria-describedby={errors.price ? 'price-error' : undefined}
            />
            {errors.price && (
              <Field.ErrorText id="price-error">{errors.price.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Sessions */}
          <Field.Root>
            <Field.Label>Sessions</Field.Label>
            <HStack gap={4}>
              <Switch.Root
                checked={isUnlimited}
                onCheckedChange={(e) => {
                  setValue('isUnlimited', e.checked);
                  if (e.checked) {
                    setValue('sessions', undefined);
                  }
                }}
              >
                <Switch.Control />
                <Switch.Label>Unlimited</Switch.Label>
              </Switch.Root>
              {!isUnlimited && (
                <Box flex={1}>
                  <Input
                    type="number"
                    {...register('sessions', { valueAsNumber: true })}
                    placeholder="10"
                    min={1}
                    aria-invalid={!!errors.sessions}
                    aria-describedby={errors.sessions ? 'sessions-error' : undefined}
                  />
                  {errors.sessions && (
                    <Field.ErrorText id="sessions-error">{errors.sessions.message}</Field.ErrorText>
                  )}
                </Box>
              )}
            </HStack>
          </Field.Root>

          {/* Is Active */}
          <Field.Root>
            <HStack justify="space-between">
              <Field.Label>Active</Field.Label>
              <Switch.Root
                checked={watch('isActive')}
                onCheckedChange={(e) => setValue('isActive', e.checked)}
              >
                <Switch.Control />
              </Switch.Root>
            </HStack>
          </Field.Root>

          {/* Is Group */}
          <Field.Root>
            <HStack justify="space-between">
              <Field.Label>Group Package</Field.Label>
              <Switch.Root
                checked={watch('isGroup')}
                onCheckedChange={(e) => setValue('isGroup', e.checked)}
              >
                <Switch.Control />
              </Switch.Root>
            </HStack>
          </Field.Root>

          {/* Is Visible */}
          <Field.Root>
            <HStack justify="space-between">
              <Field.Label>Visible</Field.Label>
              <Switch.Root
                checked={watch('isVisible')}
                onCheckedChange={(e) => setValue('isVisible', e.checked)}
              >
                <Switch.Control />
              </Switch.Root>
            </HStack>
          </Field.Root>
        </VStack>
      </ModalForm>

    </Box>
  );
}

