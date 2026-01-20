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
  Spinner,
} from '@chakra-ui/react';
import { HiPlus, HiX, HiChevronDown, HiChevronUp, HiFilter } from 'react-icons/hi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fetchTrainers, createTrainer, updateTrainer, FetchTrainersParams } from '@/services/api/trainers';
import { queryKeys } from '@/services/api/queryKeys';
import { useIsAdmin } from '@/hooks/useRequireAdmin';
import { useToast } from '@/utils/toast';
import { getErrorMessage } from '@/utils/error';
import { SearchInput } from '@/components/ui/SearchInput';
import { ModalForm } from '@/components/ui/ModalForm';
import { Pagination } from '@/components/ui/Pagination';
import { ModernButton } from '@/components/ui/ModernButton';
import { Trainer } from '@/types/trainer';
import { TrainerCard } from './components/TrainerCard';
import * as prefetchers from '@/routes/prefetchers';
import { useSearch } from '@/contexts/SearchContext';

// Form validation schema - matches API requirements
const trainerFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  nic: z.string().regex(/^[0-9]{9}[vVxX]?$/, 'Invalid NIC format (e.g., 123456789V)'),
  email: z.string().email('Invalid email'),
  mobile: z.string().regex(/^[0-9]{10,15}$/, 'Invalid phone number (10-15 digits)'),
  isFullTime: z.boolean(),
  isAdmin: z.boolean().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(), // Only for create
});

type TrainerFormData = z.infer<typeof trainerFormSchema>;

export default function TrainersPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const isAdmin = useIsAdmin();
  const { searchQuery, setSearchQuery } = useSearch();

  // State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'part-time' | 'full-time'>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<TrainerFormData>({
    resolver: zodResolver(trainerFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      nic: '',
      email: '',
      mobile: '',
      isFullTime: true,
      isAdmin: false,
      password: '',
    },
  });

  // Sanitize and validate search term
  const sanitizedSearch = useMemo(() => {
    if (!debouncedSearch) return undefined;
    
    // Trim and remove excessive whitespace
    const trimmed = debouncedSearch.trim().replace(/\s+/g, ' ');
    
    // Minimum 2 characters for search
    if (trimmed.length < 2) return undefined;
    
    // Remove potentially dangerous characters but keep spaces and common search chars
    const sanitized = trimmed.replace(/[<>{}[\]\\]/g, '');
    
    return sanitized || undefined;
  }, [debouncedSearch]);

  // Build query params with filters
  const queryParams = useMemo(() => {
    const params: FetchTrainersParams = {
      page,
      size: pageSize,
      search: sanitizedSearch,
    };
    
    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }
    
    if (typeFilter !== 'all') {
      params.type = typeFilter;
    }
    
    return params;
  }, [page, pageSize, sanitizedSearch, statusFilter, typeFilter]);

  // Fetch trainers list
  const { data: trainersData, isLoading, refetch, isFetching } = useQuery({
    queryKey: queryKeys.trainers.list(queryParams),
    queryFn: async () => {
      setIsSearching(true);
      try {
        const result = await fetchTrainers(queryParams);
        return result;
      } finally {
        setIsSearching(false);
      }
    },
    staleTime: 60000, // 1 minute
    enabled: true,
  });

  // Track search state
  useEffect(() => {
    if (isFetching && sanitizedSearch) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [isFetching, sanitizedSearch]);

  // Client-side search function (fallback if API search doesn't work or for additional filtering)
  const performClientSideSearch = useCallback((trainers: Trainer[], searchTerm: string): Trainer[] => {
    if (!searchTerm || searchTerm.length < 2) return trainers;
    
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const searchTerms = normalizedSearch.split(/\s+/).filter(term => term.length > 0);
    
    return trainers.filter((trainer) => {
      // Get searchable fields
      const firstName = trainer.firstName?.toLowerCase() || '';
      const lastName = trainer.lastName?.toLowerCase() || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const email = trainer.email?.toLowerCase() || '';
      const mobile = trainer.mobile?.toLowerCase() || '';
      const memberId = ((trainer as any).memberId || trainer._id)?.toLowerCase() || '';
      const nic = trainer.nic?.toLowerCase() || '';
      
      // Combine all searchable text
      const searchableText = `${fullName} ${email} ${mobile} ${memberId} ${nic}`.toLowerCase();
      
      // Check if all search terms match (AND logic for multiple terms)
      return searchTerms.every(term => searchableText.includes(term));
    });
  }, []);

  // Apply client-side filters (status, type, date range) and search
  const filteredTrainers = useMemo(() => {
    if (!trainersData?.items) return [];
    
    // First apply client-side search if we have a search term
    let trainers: Trainer[] = trainersData.items;
    if (sanitizedSearch) {
      trainers = performClientSideSearch(trainers, sanitizedSearch);
    }
    
    // Then apply other filters
    return trainers.filter((trainer: Trainer) => {
      // Status filter
      if (statusFilter !== 'all') {
        const isActive = trainer.isActive ?? true;
        if (statusFilter === 'active' && !isActive) return false;
        if (statusFilter === 'inactive' && isActive) return false;
      }
      
      // Type filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'full-time' && !trainer.isFullTime) return false;
        if (typeFilter === 'part-time' && trainer.isFullTime) return false;
      }
      
      // Date range filter
      if (dateFrom || dateTo) {
        const trainerDate = trainer.createdAt ? new Date(trainer.createdAt) : null;
        if (trainerDate) {
          if (dateFrom && trainerDate < new Date(dateFrom)) return false;
          if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            if (trainerDate > toDate) return false;
          }
        }
      }
      
      return true;
    });
  }, [trainersData?.items, statusFilter, typeFilter, dateFrom, dateTo, sanitizedSearch, performClientSideSearch]);

  // Calculate filtered total and pages
  const filteredTotal = filteredTrainers.length;
  const filteredTotalPages = Math.ceil(filteredTotal / pageSize);
  const paginatedTrainers = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredTrainers.slice(start, end);
  }, [filteredTrainers, page, pageSize]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (typeFilter !== 'all') count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    return count;
  }, [statusFilter, typeFilter, dateFrom, dateTo]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setStatusFilter('all');
    setTypeFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }, []);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: TrainerFormData) => {
      const apiPayload: Partial<Trainer> = {
        firstName: data.firstName,
        lastName: data.lastName,
        nic: data.nic,
        email: data.email,
        mobile: data.mobile,
        isFullTime: data.isFullTime,
        isAdmin: data.isAdmin ?? false,
        isActive: true,
      };
      
      // Add password if provided (for create)
      if (data.password) {
        (apiPayload as any).password = data.password;
      }
      
      return createTrainer(apiPayload);
    },
    onSuccess: () => {
      toast.create({
        title: 'Success',
        description: 'Trainer created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsCreateModalOpen(false);
      reset();
      qc.invalidateQueries({ queryKey: queryKeys.trainers.all });
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
    mutationFn: async ({ id, data }: { id: string; data: TrainerFormData }) => {
      const apiPayload: Partial<Trainer> = {
        firstName: data.firstName,
        lastName: data.lastName,
        nic: data.nic,
        email: data.email,
        mobile: data.mobile,
        isFullTime: data.isFullTime,
        isAdmin: data.isAdmin ?? false,
        isActive: selectedTrainer?.isActive ?? true,
      };
      
      // Add password if provided (for password change)
      if (data.password && data.password.length > 0) {
        (apiPayload as any).password = data.password;
      }
      
      return updateTrainer(id, apiPayload);
    },
    onSuccess: () => {
      toast.create({
        title: 'Success',
        description: 'Trainer updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsEditModalOpen(false);
      setSelectedTrainer(null);
      reset();
      qc.invalidateQueries({ queryKey: queryKeys.trainers.all });
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
    document.title = 'Trainers • PayZhe';
    prefetchers.prefetchTrainers(qc);
  }, [qc]);

  // Keyboard shortcuts: Ctrl+K to focus search, Escape to clear search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('');
        setDebouncedSearch('');
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchQuery]);

  // Handle search - use SearchInput's debouncing
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
  }, [setSearchQuery]);

  const handleDebouncedSearchChange = useCallback((value: string) => {
    setDebouncedSearch(value);
    setPage(1);
  }, []);

  // Handle create form submit
  const handleCreateSubmit = async (data: TrainerFormData) => {
    await createMutation.mutateAsync(data);
  };

  // Handle edit form submit
  const handleEditSubmit = async (data: TrainerFormData) => {
    if (selectedTrainer) {
      await updateMutation.mutateAsync({ id: selectedTrainer._id, data });
    }
  };

  // Open edit modal
  const handleEdit = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setValue('firstName', trainer.firstName || '');
    setValue('lastName', trainer.lastName || '');
    setValue('nic', trainer.nic || '');
    setValue('email', trainer.email || '');
    setValue('mobile', trainer.mobile || '');
    setValue('isFullTime', trainer.isFullTime ?? true);
    setValue('isAdmin', trainer.isAdmin ?? false);
    setValue('password', ''); // Don't pre-fill password
    setIsEditModalOpen(true);
    setActionMenuOpen(null);
  };


  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, dateFrom, dateTo]);

  return (
    <Box px={{ base: 3, md: 6, lg: 8 }} py={{ base: 3, md: 6, lg: 8 }}>
      {/* Header */}
      <HStack justify="space-between" align="center" mb={{ base: 4, md: 5, lg: 6 }} flexWrap="wrap" gap={{ base: 3, md: 4 }}>
        <Box>
          <Heading size={{ base: 'xl', md: '2xl' }} mb={{ base: 1, md: 2 }}>
            Trainers
          </Heading>
          <Text color="gray.600" fontSize="sm">
            Manage gym trainers and staff
          </Text>
        </Box>
        <ModernButton
          colorPalette="blue"
          onClick={() => {
            reset();
            setIsCreateModalOpen(true);
          }}
          disabled={!isAdmin}
          aria-label="Add Trainer"
        >
          <HiPlus />
          Add Trainer
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
              placeholder="Search by name, email, phone, member ID, or NIC... (Ctrl+K)"
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
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>

              {/* Type Filter */}
              <Field.Root>
                <Field.Label>Trainer Type</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as 'all' | 'part-time' | 'full-time')}
                  >
                    <option value="all">All Types</option>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>

              {/* Date From */}
              <Field.Root>
                <Field.Label>Date From</Field.Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="Start date"
                />
              </Field.Root>

              {/* Date To */}
              <Field.Root>
                <Field.Label>Date To</Field.Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="End date"
                />
              </Field.Root>
            </SimpleGrid>
          </Box>
        )}
      </Box>

      {/* Search Results Header */}
      {sanitizedSearch && (
        <Box mb={{ base: 3, md: 4 }}>
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
            <Text fontSize="sm" color="gray.600">
              {isSearching ? (
                <HStack gap={2}>
                  <Spinner size="sm" colorPalette="blue" />
                  <Text>Searching...</Text>
                </HStack>
              ) : (
                <>
                  Found <Text as="span" fontWeight="semibold" color="gray.900">{filteredTotal}</Text> trainer{filteredTotal !== 1 ? 's' : ''} matching &quot;<Text as="span" fontWeight="semibold" color="gray.900">{sanitizedSearch}</Text>&quot;
                </>
              )}
            </Text>
          </HStack>
        </Box>
      )}

      {/* Trainer Cards Grid */}
      <Box mb={6}>
        {isLoading && !trainersData ? (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={4}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <TrainerCard key={i} trainer={{} as Trainer} isLoading={true} />
            ))}
          </SimpleGrid>
        ) : paginatedTrainers.length === 0 ? (
          <Center py={12}>
            <VStack gap={3}>
              <Text fontSize="lg" color="gray.500" fontWeight="medium">
                {sanitizedSearch ? (
                  <>No trainers found matching &quot;<Text as="span" fontWeight="semibold" color="gray.900">{sanitizedSearch}</Text>&quot;</>
                ) : (
                  'No trainers found'
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
            {paginatedTrainers.map((trainer) => (
              <TrainerCard
                key={trainer._id}
                trainer={trainer}
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
        title="Add Trainer"
        submitLabel="Create"
        isLoading={isSubmitting || createMutation.isPending}
        isDisabled={isSubmitting || createMutation.isPending}
        size="lg"
      >
        <VStack gap={4} align="stretch">
          {/* Personal Information */}
          <Text fontSize="md" fontWeight="semibold" color="gray.900" mt={2} mb={2}>
            Personal Information
          </Text>

          <HStack gap={4}>
            <Field.Root invalid={!!errors.firstName} flex={1}>
              <Field.Label>First Name *</Field.Label>
              <Input
                {...register('firstName')}
                placeholder="John"
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
              />
              {errors.firstName && (
                <Field.ErrorText id="firstName-error">{errors.firstName.message}</Field.ErrorText>
              )}
            </Field.Root>

            <Field.Root invalid={!!errors.lastName} flex={1}>
              <Field.Label>Last Name *</Field.Label>
              <Input
                {...register('lastName')}
                placeholder="Doe"
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
              />
              {errors.lastName && (
                <Field.ErrorText id="lastName-error">{errors.lastName.message}</Field.ErrorText>
              )}
            </Field.Root>
          </HStack>

          {/* NIC */}
          <Field.Root invalid={!!errors.nic}>
            <Field.Label>NIC (National Identity Card) *</Field.Label>
            <Input
              {...register('nic')}
              placeholder="123456789V"
              aria-invalid={!!errors.nic}
              aria-describedby={errors.nic ? 'nic-error' : undefined}
            />
            {errors.nic && (
              <Field.ErrorText id="nic-error">{errors.nic.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Contact Information */}
          <Text fontSize="md" fontWeight="semibold" color="gray.900" mt={2} mb={2}>
            Contact Information
          </Text>

          {/* Phone */}
          <Field.Root invalid={!!errors.mobile}>
            <Field.Label>Mobile *</Field.Label>
            <Input
              type="tel"
              {...register('mobile')}
              placeholder="0712345678"
              aria-invalid={!!errors.mobile}
              aria-describedby={errors.mobile ? 'mobile-error' : undefined}
            />
            {errors.mobile && (
              <Field.ErrorText id="mobile-error">{errors.mobile.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Email */}
          <Field.Root invalid={!!errors.email}>
            <Field.Label>Email *</Field.Label>
            <Input
              type="email"
              {...register('email')}
              placeholder="john@example.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <Field.ErrorText id="email-error">{errors.email.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Trainer Information */}
          <Text fontSize="md" fontWeight="semibold" color="gray.900" mt={2} mb={2}>
            Trainer Information
          </Text>

          {/* Full Time / Part Time */}
          <Field.Root invalid={!!errors.isFullTime}>
            <Field.Label>Employment Type *</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                value={watch('isFullTime') ? 'true' : 'false'}
                onChange={(e) => setValue('isFullTime', e.target.value === 'true')}
                aria-invalid={!!errors.isFullTime}
                aria-describedby={errors.isFullTime ? 'isFullTime-error' : undefined}
              >
                <option value="true">Full Time</option>
                <option value="false">Part Time</option>
              </NativeSelect.Field>
            </NativeSelect.Root>
            {errors.isFullTime && (
              <Field.ErrorText id="isFullTime-error">{errors.isFullTime.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Admin Status */}
          <Field.Root invalid={!!errors.isAdmin}>
            <Field.Label>Admin Status</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                value={watch('isAdmin') ? 'true' : 'false'}
                onChange={(e) => setValue('isAdmin', e.target.value === 'true')}
                aria-invalid={!!errors.isAdmin}
                aria-describedby={errors.isAdmin ? 'isAdmin-error' : undefined}
              >
                <option value="false">Regular User</option>
                <option value="true">Admin</option>
              </NativeSelect.Field>
            </NativeSelect.Root>
            {errors.isAdmin && (
              <Field.ErrorText id="isAdmin-error">{errors.isAdmin.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Password */}
          <Field.Root invalid={!!errors.password}>
            <Field.Label>Password *</Field.Label>
            <Input
              type="password"
              {...register('password')}
              placeholder="Enter password (min 8 characters)"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <Field.ErrorText id="password-error">{errors.password.message}</Field.ErrorText>
            )}
          </Field.Root>
        </VStack>
      </ModalForm>

      {/* Edit Modal */}
      <ModalForm
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTrainer(null);
          reset();
        }}
        onSubmit={handleSubmit(handleEditSubmit)}
        title="Edit Trainer"
        submitLabel="Save"
        isLoading={isSubmitting || updateMutation.isPending}
        isDisabled={isSubmitting || updateMutation.isPending}
        size="lg"
      >
        <VStack gap={4} align="stretch">
          {/* Personal Information */}
          <Text fontSize="md" fontWeight="semibold" color="gray.900" mt={2} mb={2}>
            Personal Information
          </Text>

          <HStack gap={4}>
            <Field.Root invalid={!!errors.firstName} flex={1}>
              <Field.Label>First Name *</Field.Label>
              <Input
                {...register('firstName')}
                placeholder="John"
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
              />
              {errors.firstName && (
                <Field.ErrorText id="firstName-error">{errors.firstName.message}</Field.ErrorText>
              )}
            </Field.Root>

            <Field.Root invalid={!!errors.lastName} flex={1}>
              <Field.Label>Last Name *</Field.Label>
              <Input
                {...register('lastName')}
                placeholder="Doe"
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
              />
              {errors.lastName && (
                <Field.ErrorText id="lastName-error">{errors.lastName.message}</Field.ErrorText>
              )}
            </Field.Root>
          </HStack>

          {/* NIC */}
          <Field.Root invalid={!!errors.nic}>
            <Field.Label>NIC (National Identity Card) *</Field.Label>
            <Input
              {...register('nic')}
              placeholder="123456789V"
              aria-invalid={!!errors.nic}
              aria-describedby={errors.nic ? 'nic-error' : undefined}
            />
            {errors.nic && (
              <Field.ErrorText id="nic-error">{errors.nic.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Contact Information */}
          <Text fontSize="md" fontWeight="semibold" color="gray.900" mt={2} mb={2}>
            Contact Information
          </Text>

          {/* Phone */}
          <Field.Root invalid={!!errors.mobile}>
            <Field.Label>Mobile *</Field.Label>
            <Input
              type="tel"
              {...register('mobile')}
              placeholder="0712345678"
              aria-invalid={!!errors.mobile}
              aria-describedby={errors.mobile ? 'mobile-error' : undefined}
            />
            {errors.mobile && (
              <Field.ErrorText id="mobile-error">{errors.mobile.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Email */}
          <Field.Root invalid={!!errors.email}>
            <Field.Label>Email *</Field.Label>
            <Input
              type="email"
              {...register('email')}
              placeholder="john@example.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <Field.ErrorText id="email-error">{errors.email.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Trainer Information */}
          <Text fontSize="md" fontWeight="semibold" color="gray.900" mt={2} mb={2}>
            Trainer Information
          </Text>

          {/* Full Time / Part Time */}
          <Field.Root invalid={!!errors.isFullTime}>
            <Field.Label>Employment Type *</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                value={watch('isFullTime') ? 'true' : 'false'}
                onChange={(e) => setValue('isFullTime', e.target.value === 'true')}
                aria-invalid={!!errors.isFullTime}
                aria-describedby={errors.isFullTime ? 'isFullTime-error' : undefined}
              >
                <option value="true">Full Time</option>
                <option value="false">Part Time</option>
              </NativeSelect.Field>
            </NativeSelect.Root>
            {errors.isFullTime && (
              <Field.ErrorText id="isFullTime-error">{errors.isFullTime.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Admin Status */}
          <Field.Root invalid={!!errors.isAdmin}>
            <Field.Label>Admin Status</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                value={watch('isAdmin') ? 'true' : 'false'}
                onChange={(e) => setValue('isAdmin', e.target.value === 'true')}
                aria-invalid={!!errors.isAdmin}
                aria-describedby={errors.isAdmin ? 'isAdmin-error' : undefined}
              >
                <option value="false">Regular User</option>
                <option value="true">Admin</option>
              </NativeSelect.Field>
            </NativeSelect.Root>
            {errors.isAdmin && (
              <Field.ErrorText id="isAdmin-error">{errors.isAdmin.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Password (optional for edit) */}
          <Field.Root invalid={!!errors.password}>
            <Field.Label>New Password (Optional)</Field.Label>
            <Input
              type="password"
              {...register('password')}
              placeholder="Leave blank to keep current password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <Field.ErrorText id="password-error">{errors.password.message}</Field.ErrorText>
            )}
          </Field.Root>
        </VStack>
      </ModalForm>

    </Box>
  );
}
