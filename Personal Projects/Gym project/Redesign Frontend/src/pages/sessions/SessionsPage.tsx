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
} from '@chakra-ui/react';
import { HiPlus, HiX, HiChevronDown, HiChevronUp, HiFilter } from 'react-icons/hi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fetchSessions, createSession, markAttendance, cancelSession } from '@/services/api/sessions';
import { fetchCustomersList } from '@/services/api/customers';
import { fetchTrainers } from '@/services/api/trainers';
import { Trainer } from '@/types/trainer';
import { SessionsListResponse } from '@/services/api/sessions';
import { queryKeys } from '@/services/api/queryKeys';
import { useIsAdmin } from '@/hooks/useRequireAdmin';
import { useToast } from '@/utils/toast';
import { getErrorMessage } from '@/utils/error';
import { SearchInput } from '@/components/ui/SearchInput';
import { ModernButton } from '@/components/ui/ModernButton';
import { ModalForm } from '@/components/ui/ModalForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Pagination } from '@/components/ui/Pagination';
import { CustomerSearch } from '@/components/ui/CustomerSearch';
import { PTSession, DocumentStatus, FetchSessionsParams } from '@/types/session';
import { SessionCard } from './components/SessionCard';
import * as prefetchers from '@/routes/prefetchers';
import { useSearch } from '@/contexts/SearchContext';

// Form validation schema
const sessionFormSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  trainerId: z.string().min(1, 'Trainer is required'),
  trainerName: z.string().min(1, 'Trainer name is required'),
});

type SessionFormData = z.infer<typeof sessionFormSchema>;

type StatusFilter = 'all' | 'ACTIVE' | 'INACTIVE';
type AttendanceFilter = 'all' | 'attended' | 'missed' | 'cancelled' | 'pending';
type ExtraSessionFilter = 'all' | 'yes' | 'no';

export default function SessionsPage() {
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
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>('all');
  const [extraSessionFilter, setExtraSessionFilter] = useState<ExtraSessionFilter>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [trainerFilter, setTrainerFilter] = useState<string>('');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<PTSession | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch customers and trainers for form dropdowns
  const { data: customersData } = useQuery({
    queryKey: queryKeys.customers.list({ page: 1, limit: 1000 }),
    queryFn: () => fetchCustomersList({ page: 1, size: 1000 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: trainersData } = useQuery({
    queryKey: queryKeys.trainers.list({ page: 1, size: 1000 }),
    queryFn: () => fetchTrainers({ page: 1, size: 1000 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const customers = useMemo(() => {
    return customersData?.customers || [];
  }, [customersData]);

  const trainers: Trainer[] = useMemo(() => {
    if (Array.isArray(trainersData)) {
      return trainersData;
    }
    return trainersData?.items || [];
  }, [trainersData]);

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<SessionFormData>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      customerId: '',
      customerName: '',
      trainerId: '',
      trainerName: '',
    },
  });

  const selectedCustomerId = watch('customerId');
  const selectedTrainerId = watch('trainerId');

  // Auto-fill customer name when customer is selected
  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find((c: any) => {
        const id = c.clientId || '';
        return id === selectedCustomerId;
      });
      if (customer) {
        const customerName = ('firstName' in customer && customer.firstName)
          ? `${customer.firstName} ${customer.lastName || ''}`.trim()
          : ('name' in customer && customer.name) ? customer.name : '';
        setValue('customerName', customerName);
      }
    }
  }, [selectedCustomerId, customers, setValue]);

  // Auto-fill trainer name when trainer is selected
  useEffect(() => {
    if (selectedTrainerId) {
      const trainer = trainers.find((t: any) => {
        const id = t._id || t.trainerId || '';
        return id === selectedTrainerId;
      });
      if (trainer) {
        const trainerName = ('firstName' in trainer && trainer.firstName)
          ? `${trainer.firstName} ${trainer.lastName || ''}`.trim()
          : '';
        setValue('trainerName', trainerName);
      }
    }
  }, [selectedTrainerId, trainers, setValue]);

  // Sanitize and validate search term
  const sanitizedSearch = useMemo(() => {
    if (!debouncedSearch) return undefined;
    const trimmed = debouncedSearch.trim();
    if (trimmed.length < 2) return undefined;
    return trimmed.replace(/\s+/g, ' ').replace(/[<>"']/g, '');
  }, [debouncedSearch]);

  // Build query params with filters
  const queryParams = useMemo((): FetchSessionsParams => {
    const params: FetchSessionsParams = {
      page,
      size: pageSize,
    };
    
    if (sanitizedSearch) {
      params.searchTerm = sanitizedSearch;
    }
    
    return params;
  }, [page, pageSize, sanitizedSearch]);

  // Fetch sessions list
  const { data: sessionsData, isLoading, refetch, isFetching } = useQuery<SessionsListResponse>({
    queryKey: queryKeys.sessions.list(queryParams),
    queryFn: async () => {
      setIsSearching(true);
      try {
        const result = await fetchSessions(queryParams);
        return result;
      } finally {
        setIsSearching(false);
      }
    },
    staleTime: 60000, // 1 minute
    placeholderData: (previousData) => previousData,
  });

  // Check if we should show loading skeleton
  const showLoadingSkeleton = isLoading && (sessionsData === undefined || (sessionsData as SessionsListResponse | undefined)?.items?.length === 0);

  // Track search state
  useEffect(() => {
    if (isFetching && sanitizedSearch) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [isFetching, sanitizedSearch]);

  // Client-side search and filter function
  const performClientSideFilter = useCallback((sessions: PTSession[]): PTSession[] => {
    let filtered = [...sessions];

    // Client-side search
    if (sanitizedSearch) {
      const normalizedSearch = sanitizedSearch.toLowerCase().trim();
      const searchTerms = normalizedSearch.split(/\s+/).filter(term => term.length > 0);
      
      filtered = filtered.filter((session) => {
        const sessionId = session._id?.toLowerCase() || '';
        const customerName = (session.customerName || session.customer_name || '').toLowerCase();
        const trainerName = (session.trainerName || session.trainer_name || '').toLowerCase();
        const customerNIC = (session.customer_nic || '').toLowerCase();
        
        const searchableText = `${sessionId} ${customerName} ${trainerName} ${customerNIC}`.toLowerCase();
        
        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((session) => {
        const sessionStatus = session.status || DocumentStatus.ACTIVE;
        return sessionStatus === statusFilter;
      });
    }

    // Attendance filter
    if (attendanceFilter !== 'all') {
      filtered = filtered.filter((session) => {
        const sessionAttendance = session.attendance || 'pending';
        return sessionAttendance === attendanceFilter;
      });
    }

    // Extra session filter
    if (extraSessionFilter !== 'all') {
      filtered = filtered.filter((session) => {
        const isExtra = session.isExtra || false;
        return extraSessionFilter === 'yes' ? isExtra : !isExtra;
      });
    }

    // Customer filter
    if (customerFilter) {
      filtered = filtered.filter((session) => {
        const sessionCustomerId = session.customerId || session.customer_id || '';
        return sessionCustomerId === customerFilter;
      });
    }

    // Trainer filter
    if (trainerFilter) {
      filtered = filtered.filter((session) => {
        const sessionTrainerId = session.trainerId || session.trainer_id || '';
        return sessionTrainerId === trainerFilter;
      });
    }

    // Date range filter (if createdAt is available)
    if (startDateFilter) {
      filtered = filtered.filter((session) => {
        if (!session.createdAt) return false;
        const sessionDate = new Date(session.createdAt);
        const startDate = new Date(startDateFilter);
        return sessionDate >= startDate;
      });
    }

    if (endDateFilter) {
      filtered = filtered.filter((session) => {
        if (!session.createdAt) return false;
        const sessionDate = new Date(session.createdAt);
        const endDate = new Date(endDateFilter);
        endDate.setHours(23, 59, 59, 999); // Include entire end date
        return sessionDate <= endDate;
      });
    }

    return filtered;
  }, [sanitizedSearch, statusFilter, attendanceFilter, extraSessionFilter, customerFilter, trainerFilter, startDateFilter, endDateFilter]);

  // Filtered and searched sessions
  const filteredSessions = useMemo(() => {
    const sessions = sessionsData?.items || [];
    return performClientSideFilter(sessions);
  }, [sessionsData?.items, performClientSideFilter]);

  // Calculate pagination
  const filteredTotal = filteredSessions.length;
  const filteredTotalPages = Math.ceil(filteredTotal / pageSize);
  const paginatedSessions = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredSessions.slice(start, end);
  }, [filteredSessions, page, pageSize]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (attendanceFilter !== 'all') count++;
    if (extraSessionFilter !== 'all') count++;
    if (customerFilter) count++;
    if (trainerFilter) count++;
    if (startDateFilter) count++;
    if (endDateFilter) count++;
    return count;
  }, [statusFilter, attendanceFilter, extraSessionFilter, customerFilter, trainerFilter, startDateFilter, endDateFilter]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setStatusFilter('all');
    setAttendanceFilter('all');
    setExtraSessionFilter('all');
    setCustomerFilter('');
    setTrainerFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setPage(1);
  }, []);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: SessionFormData) => {
      return createSession({
        customerId: data.customerId,
        customerName: data.customerName,
        trainerId: data.trainerId,
        trainerName: data.trainerName,
      });
    },
    onSuccess: () => {
      toast.create({
        title: 'Success',
        description: 'Session created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsCreateModalOpen(false);
      reset();
      qc.invalidateQueries({ queryKey: queryKeys.sessions.all });
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

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: (session: PTSession) => {
      return markAttendance(session._id, {
        trainerId: session.trainerId || session.trainer_id,
        customerId: session.customerId || session.customer_id,
      });
    },
    onSuccess: () => {
      toast.create({
        title: 'Success',
        description: 'Session marked as attended',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      qc.invalidateQueries({ queryKey: queryKeys.sessions.all });
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

  // Cancel session mutation
  const cancelMutation = useMutation({
    mutationFn: (sessionId: string) => {
      return cancelSession(sessionId);
    },
    onSuccess: () => {
      toast.create({
        title: 'Success',
        description: 'Session cancelled successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsCancelDialogOpen(false);
      setSelectedSession(null);
      qc.invalidateQueries({ queryKey: queryKeys.sessions.all });
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
    document.title = 'Sessions • PayZhe';
    prefetchers.prefetchSessions(qc);
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
  }, [statusFilter, attendanceFilter, extraSessionFilter, customerFilter, trainerFilter, startDateFilter, endDateFilter]);

  // Handle create form submit
  const handleCreateSubmit = async (data: SessionFormData) => {
    await createMutation.mutateAsync(data);
  };

  // Handle mark attendance
  const handleMarkAttendance = async (session: PTSession) => {
    await markAttendanceMutation.mutateAsync(session);
  };

  // Handle cancel
  const handleCancel = async () => {
    if (selectedSession) {
      const sessionId = selectedSession._id;
      if (sessionId) {
        await cancelMutation.mutateAsync(sessionId);
      }
    }
  };

  // Open cancel dialog
  const handleCancelClick = (session: PTSession) => {
    setSelectedSession(session);
    setIsCancelDialogOpen(true);
    setActionMenuOpen(null);
  };


  return (
    <Box px={{ base: 3, md: 6, lg: 8 }} py={{ base: 3, md: 6, lg: 8 }}>
      {/* Header */}
      <HStack justify="space-between" align="center" mb={{ base: 4, md: 5, lg: 6 }} flexWrap="wrap" gap={{ base: 3, md: 4 }}>
        <Box>
          <Heading size={{ base: 'xl', md: '2xl' }} mb={{ base: 1, md: 2 }}>
            Sessions
          </Heading>
          <Text color="gray.600" fontSize="sm">
            Manage training sessions and attendance
          </Text>
        </Box>
        <ModernButton
          colorPalette="blue"
          onClick={() => {
            reset();
            setIsCreateModalOpen(true);
          }}
          disabled={!isAdmin}
          aria-label="Add Session"
        >
          <HiPlus />
          Add Session
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
              placeholder="Search by session ID, customer name, trainer name, or customer NIC..."
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
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>

              {/* Attendance Filter */}
              <Field.Root>
                <Field.Label>Attendance</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={attendanceFilter}
                    onChange={(e) => setAttendanceFilter(e.target.value as AttendanceFilter)}
                  >
                    <option value="all">All Attendance</option>
                    <option value="attended">Attended</option>
                    <option value="missed">Missed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="pending">Pending</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>

              {/* Extra Session Filter */}
              <Field.Root>
                <Field.Label>Extra Session</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={extraSessionFilter}
                    onChange={(e) => setExtraSessionFilter(e.target.value as ExtraSessionFilter)}
                  >
                    <option value="all">All</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>

              {/* Customer Filter */}
              <Field.Root>
                <Field.Label>Customer</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value)}
                  >
                    <option value="">All Customers</option>
                    {customers.map((customer: any) => {
                      const customerId = customer.clientId || '';
                      const customerName = ('firstName' in customer && customer.firstName)
                        ? `${customer.firstName} ${customer.lastName || ''}`.trim()
                        : customer.name || customerId;
                      return (
                        <option key={customerId} value={customerId}>
                          {customerName}
                        </option>
                      );
                    })}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>

              {/* Trainer Filter */}
              <Field.Root>
                <Field.Label>Trainer</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={trainerFilter}
                    onChange={(e) => setTrainerFilter(e.target.value)}
                  >
                    <option value="">All Trainers</option>
                    {trainers.map((trainer: Trainer) => {
                      const trainerId = trainer._id || '';
                      const trainerName = ('firstName' in trainer && trainer.firstName)
                        ? `${trainer.firstName} ${trainer.lastName || ''}`.trim()
                        : trainerId;
                      return (
                        <option key={trainerId} value={trainerId}>
                          {trainerName}
                        </option>
                      );
                    })}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>

              {/* Start Date Filter */}
              <Field.Root>
                <Field.Label>Start Date</Field.Label>
                <Input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  placeholder="Start date"
                />
              </Field.Root>

              {/* End Date Filter */}
              <Field.Root>
                <Field.Label>End Date</Field.Label>
                <Input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  placeholder="End date"
                />
              </Field.Root>
            </SimpleGrid>
          </Box>
        )}
      </Box>

      {/* Search Results Header */}
      {sanitizedSearch && (
        <Box mb={4}>
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
                  Found <Text as="span" fontWeight="semibold" color="gray.900">{filteredTotal}</Text> session{filteredTotal !== 1 ? 's' : ''} matching &quot;<Text as="span" fontWeight="semibold" color="gray.900">{sanitizedSearch}</Text>&quot;
                </>
              )}
            </Text>
          </HStack>
        </Box>
      )}

      {/* Session Cards Grid */}
      <Box mb={{ base: 4, md: 5, lg: 6 }}>
        {showLoadingSkeleton ? (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={{ base: 3, md: 4, lg: 5 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <SessionCard key={i} session={{} as PTSession} isLoading={true} />
            ))}
          </SimpleGrid>
        ) : paginatedSessions.length === 0 ? (
          <Center py={12}>
            <VStack gap={3}>
              <Text fontSize="lg" color="gray.500" fontWeight="medium">
                {sanitizedSearch ? (
                  <>No sessions found matching &quot;<Text as="span" fontWeight="semibold" color="gray.900">{sanitizedSearch}</Text>&quot;</>
                ) : (
                  'No sessions found'
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
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={{ base: 3, md: 4, lg: 5 }}>
            {paginatedSessions.map((session) => (
              <SessionCard
                key={session._id}
                session={session}
                onMarkAttendance={handleMarkAttendance}
                onCancel={handleCancelClick}
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
        title="Add Session"
        submitLabel="Create"
        isLoading={isSubmitting || createMutation.isPending}
        isDisabled={isSubmitting || createMutation.isPending}
        size="lg"
      >
        <VStack gap={4} align="stretch">
          {/* Customer */}
          <Field.Root invalid={!!errors.customerId}>
            <Field.Label>Customer</Field.Label>
            <CustomerSearch
              value={watch('customerId') || ''}
              onSelect={(customerId, customer) => {
                setValue('customerId', customerId);
                // Auto-fill customer name
                if (customer) {
                  const customerName = ('firstName' in customer && customer.firstName)
                    ? `${customer.firstName} ${customer.lastName || ''}`.trim()
                    : ('name' in customer ? customer.name : '') || '';
                  setValue('customerName', customerName);
                }
              }}
              customers={customers}
              placeholder="Search customer by name, email, phone, or client ID..."
              error={errors.customerId?.message}
              invalid={!!errors.customerId}
              aria-invalid={!!errors.customerId}
              aria-describedby={errors.customerId ? 'customerId-error' : undefined}
            />
            {errors.customerId && (
              <Field.ErrorText id="customerId-error">{errors.customerId.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Customer Name (auto-filled) */}
          <Field.Root invalid={!!errors.customerName}>
            <Field.Label>Customer Name</Field.Label>
            <Input
              {...register('customerName')}
              placeholder="Auto-filled from customer selection"
              readOnly
              aria-invalid={!!errors.customerName}
              aria-describedby={errors.customerName ? 'customerName-error' : undefined}
            />
            {errors.customerName && (
              <Field.ErrorText id="customerName-error">{errors.customerName.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Trainer */}
          <Field.Root invalid={!!errors.trainerId}>
            <Field.Label>Trainer</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                {...register('trainerId')}
                aria-invalid={!!errors.trainerId}
                aria-describedby={errors.trainerId ? 'trainerId-error' : undefined}
              >
                <option value="">Select trainer</option>
                {trainers.map((trainer: any) => {
                  const trainerId = trainer._id || trainer.trainerId || '';
                  const trainerName = ('firstName' in trainer && trainer.firstName)
                    ? `${trainer.firstName} ${trainer.lastName || ''}`.trim()
                    : trainer.name || trainerId;
                  return (
                    <option key={trainerId} value={trainerId}>
                      {trainerName}
                    </option>
                  );
                })}
              </NativeSelect.Field>
            </NativeSelect.Root>
            {errors.trainerId && (
              <Field.ErrorText id="trainerId-error">{errors.trainerId.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Trainer Name (auto-filled) */}
          <Field.Root invalid={!!errors.trainerName}>
            <Field.Label>Trainer Name</Field.Label>
            <Input
              {...register('trainerName')}
              placeholder="Auto-filled from trainer selection"
              readOnly
              aria-invalid={!!errors.trainerName}
              aria-describedby={errors.trainerName ? 'trainerName-error' : undefined}
            />
            {errors.trainerName && (
              <Field.ErrorText id="trainerName-error">{errors.trainerName.message}</Field.ErrorText>
            )}
          </Field.Root>
        </VStack>
      </ModalForm>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isCancelDialogOpen}
        onClose={() => {
          setIsCancelDialogOpen(false);
          setSelectedSession(null);
        }}
        onConfirm={handleCancel}
        title="Cancel Session"
        message={
          selectedSession
            ? `Are you sure you want to cancel this session for ${selectedSession.customerName || selectedSession.customer_name || 'the customer'}?`
            : 'Are you sure you want to cancel this session?'
        }
        confirmLabel="Cancel Session"
        confirmColorScheme="orange"
        isLoading={cancelMutation.isPending}
      />

    </Box>
  );
}
