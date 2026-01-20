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
  Switch,
  RadioGroup,
  Table,
  Skeleton,
} from '@chakra-ui/react';
import { HiPlus, HiX, HiChevronDown, HiChevronUp, HiFilter } from 'react-icons/hi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fetchClientPayments, createClientPayment, FetchClientPaymentsParams, fetchPaymentsByUserId } from '@/services/api/finances';
import { fetchCustomersList } from '@/services/api/customers';
import { fetchPackages } from '@/services/api/packages';
import { queryKeys } from '@/services/api/queryKeys';
import { Package } from '@/types/package';
import { useIsAdmin } from '@/hooks/useRequireAdmin';
import { useToast } from '@/utils/toast';
import { getErrorMessage } from '@/utils/error';
import { SearchInput } from '@/components/ui/SearchInput';
import { ModalForm } from '@/components/ui/ModalForm';
import { Pagination } from '@/components/ui/Pagination';
import { CustomerSearch } from '@/components/ui/CustomerSearch';
import { Payment } from '@/types/finance';
import { PaymentCard } from './components/PaymentCard';
import * as prefetchers from '@/routes/prefetchers';
import { format, addMonths, subMonths } from 'date-fns';
import { formatDate, formatCurrency } from '@/components/dashboard/utils/formatters';
import { ModernButton } from '@/components/ui/ModernButton';
import { useSearch } from '@/contexts/SearchContext';

// Form validation schema
const paymentFormSchema = z.object({
  paidFor: z.string().min(1, 'Client is required'),
  amountSource: z.enum(['package', 'manual']).default('package'),
  packageId: z.string().optional(),
  amount: z.number().min(0, 'Amount must be non-negative').optional(),
  month: z.string().min(1, 'Month is required'),
  reference: z.string().min(1, 'Reference is required'),
  paidBy: z.string().optional().or(z.literal('')),
  isExtra: z.boolean().optional(),
  accessgiven: z.boolean().optional(),
  sessionQuota: z.number().int().min(0).optional().or(z.null()),
}).refine((data) => {
  if (data.amountSource === 'package') {
    return !!data.packageId;
  }
  return true;
}, {
  message: 'Package is required when using package amount',
  path: ['packageId'],
}).refine((data) => {
  if (data.amountSource === 'manual') {
    return data.amount !== undefined && data.amount >= 0;
  }
  return true;
}, {
  message: 'Amount is required when using manual entry',
  path: ['amount'],
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

type StatusFilter = 'all' | 'PAID' | 'NOT_PAID' | 'ACTIVE' | 'INACTIVE';
type ExtraPaymentFilter = 'all' | 'yes' | 'no';
type AccessGivenFilter = 'all' | 'yes' | 'no';

export default function ClientPaymentsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const isAdmin = useIsAdmin();
  const { searchQuery, setSearchQuery } = useSearch();

  // State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Handle page size change - reset to page 1
  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [extraPaymentFilter, setExtraPaymentFilter] = useState<ExtraPaymentFilter>('all');
  const [accessGivenFilter, setAccessGivenFilter] = useState<AccessGivenFilter>('all');
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [minAmountFilter, setMinAmountFilter] = useState<string>('');
  const [maxAmountFilter, setMaxAmountFilter] = useState<string>('');
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch customers for form dropdown
  const { data: customersData } = useQuery({
    queryKey: queryKeys.customers.list({ page: 1, limit: 1000 }),
    queryFn: () => fetchCustomersList({ page: 1, size: 1000 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const customers = useMemo(() => {
    return customersData?.customers || [];
  }, [customersData]);

  // Fetch packages for form
  const { data: packages = [] } = useQuery({
    queryKey: queryKeys.packages.list(),
    queryFn: fetchPackages,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paidFor: '',
      amountSource: 'package',
      packageId: '',
      amount: undefined,
      month: format(new Date(), 'MMMM'), // Default to "This month"
      reference: 'Cash',
      paidBy: '',
      isExtra: false,
      accessgiven: true,
      sessionQuota: null,
    },
  });

  const isExtra = watch('isExtra');
  const amountSource = watch('amountSource');
  const packageId = watch('packageId');
  const paidFor = watch('paidFor');

  // Fetch payment history for selected customer using userPayments endpoint
  const { data: customerPaymentHistory, isLoading: isLoadingPaymentHistory, error: paymentHistoryError } = useQuery({
    queryKey: ['customer-payment-history', paidFor],
    queryFn: async () => {
      if (!paidFor || paidFor.trim().length === 0) {
        console.log('[Payment History] No customer ID, returning empty result');
        return [];
      }
      
      console.log('[Payment History] Fetching for customer:', paidFor);
      try {
        // Use the dedicated userPayments endpoint
        const payments = await fetchPaymentsByUserId(paidFor.trim());
        
        console.log('[Payment History] Response received:', {
          paymentsCount: payments?.length || 0,
          payments: payments,
        });
        
        // Sort by createdAt descending (most recent first)
        const sortedPayments = [...(payments || [])].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.paymentDate || a.updatedAt || 0).getTime();
          const dateB = new Date(b.createdAt || b.paymentDate || b.updatedAt || 0).getTime();
          return dateB - dateA; // Descending order
        });
        
        return sortedPayments;
      } catch (error) {
        console.error('[Payment History] Error fetching payment history:', error);
        // Return empty array on error (404 is handled in fetchPaymentsByUserId)
        return [];
      }
    },
    enabled: !!paidFor && paidFor.trim().length > 0, // Only fetch when customer is selected and has valid ID
    staleTime: 0, // Always refetch when paidFor changes
    refetchOnMount: true,
    retry: 1,
  });

  // Sanitize and validate search term
  const sanitizedSearch = useMemo(() => {
    if (!debouncedSearch) return undefined;
    const trimmed = debouncedSearch.trim();
    if (trimmed.length < 2) return undefined;
    return trimmed.replace(/\s+/g, ' ').replace(/[<>"']/g, '');
  }, [debouncedSearch]);

  // Build query params with filters
  const queryParams = useMemo((): FetchClientPaymentsParams => {
    const params: FetchClientPaymentsParams = {
      page,
      size: pageSize,
    };
    
    if (sanitizedSearch) {
      params.searchTerm = sanitizedSearch;
    }
    
    // Map status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'PAID') {
        params.status = 'ACTIVE'; // Backend uses ACTIVE for paid
      } else if (statusFilter === 'NOT_PAID') {
        params.status = 'INACTIVE'; // Backend uses INACTIVE for not paid
      } else {
        params.status = statusFilter;
      }
    }
    
    if (extraPaymentFilter !== 'all') {
      params.isExtra = extraPaymentFilter === 'yes';
    }
    
    if (accessGivenFilter !== 'all') {
      params.accessgiven = accessGivenFilter === 'yes';
    }
    
    if (monthFilter) {
      params.month = monthFilter;
    }
    
    if (startDateFilter) {
      params.startDate = startDateFilter;
    }
    
    if (endDateFilter) {
      params.endDate = endDateFilter;
    }
    
    if (minAmountFilter) {
      const minAmount = parseFloat(minAmountFilter);
      if (!isNaN(minAmount)) {
        params.minAmount = minAmount;
      }
    }
    
    if (maxAmountFilter) {
      const maxAmount = parseFloat(maxAmountFilter);
      if (!isNaN(maxAmount)) {
        params.maxAmount = maxAmount;
      }
    }
    
    return params;
  }, [page, pageSize, sanitizedSearch, statusFilter, extraPaymentFilter, accessGivenFilter, monthFilter, startDateFilter, endDateFilter, minAmountFilter, maxAmountFilter]);

  // Fetch payments list
  const { data: paymentsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: queryKeys.finances.clientPayments.list(queryParams),
    queryFn: async () => {
      setIsSearching(true);
      try {
        const result = await fetchClientPayments(queryParams);
        return result;
      } finally {
        setIsSearching(false);
      }
    },
    staleTime: 60000, // 1 minute
    placeholderData: (previousData) => previousData,
  });

  // Track search state
  useEffect(() => {
    if (isFetching && sanitizedSearch) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [isFetching, sanitizedSearch]);

  // Client-side search function
  const performClientSideSearch = useCallback((payments: Payment[], searchTerm: string): Payment[] => {
    if (!searchTerm || searchTerm.length < 2) return payments;
    
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const searchTerms = normalizedSearch.split(/\s+/).filter(term => term.length > 0);
    
    return payments.filter((payment) => {
      const paymentId = payment.paymentId?.toLowerCase() || payment.id?.toLowerCase() || '';
      const reference = payment.reference?.toLowerCase() || '';
      const clientName = payment.clientName?.toLowerCase() || '';
      const month = payment.month?.toLowerCase() || '';
      
      const searchableText = `${paymentId} ${reference} ${clientName} ${month}`.toLowerCase();
      
      return searchTerms.every(term => searchableText.includes(term));
    });
  }, []);

  // Filtered and searched payments
  const filteredPayments = useMemo(() => {
    const items = paymentsData?.items || paymentsData?.payments || [];
    let filtered = items;

    // Apply client-side search if we have a search term
    if (sanitizedSearch) {
      filtered = performClientSideSearch(filtered, sanitizedSearch);
    }

    return filtered;
  }, [paymentsData, sanitizedSearch, performClientSideSearch]);

  // Calculate total amount from filtered payments
  const totalAmount = useMemo(() => {
    return filteredPayments.reduce((sum, payment) => {
      const amount = payment.amount || 0;
      return sum + amount;
    }, 0);
  }, [filteredPayments]);

  // Calculate pagination
  const filteredTotal = filteredPayments.length;
  const filteredTotalPages = Math.ceil(filteredTotal / pageSize);
  const paginatedPayments = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredPayments.slice(start, end);
  }, [filteredPayments, page, pageSize]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (extraPaymentFilter !== 'all') count++;
    if (accessGivenFilter !== 'all') count++;
    if (monthFilter) count++;
    if (startDateFilter) count++;
    if (endDateFilter) count++;
    if (minAmountFilter) count++;
    if (maxAmountFilter) count++;
    return count;
  }, [statusFilter, extraPaymentFilter, accessGivenFilter, monthFilter, startDateFilter, endDateFilter, minAmountFilter, maxAmountFilter]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setStatusFilter('all');
    setExtraPaymentFilter('all');
    setAccessGivenFilter('all');
    setMonthFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setMinAmountFilter('');
    setMaxAmountFilter('');
    setPage(1);
  }, []);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: PaymentFormData) => {
      const payload = {
        paidFor: data.paidFor,
        amount: data.amount,
        month: data.month,
        reference: data.reference,
        paidBy: data.paidBy || undefined,
      };
      return createClientPayment(payload);
    },
    onSuccess: () => {
      toast.create({
        title: 'Success',
        description: 'Payment created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsCreateModalOpen(false);
      reset();
      qc.invalidateQueries({ queryKey: queryKeys.finances.all });
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
    document.title = 'Client Payments • PayZhe';
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
  }, [statusFilter, extraPaymentFilter, accessGivenFilter, monthFilter, startDateFilter, endDateFilter, minAmountFilter, maxAmountFilter]);

  // Handle create form submit
  const handleCreateSubmit = async (data: PaymentFormData) => {
    // Ensure paidBy defaults to paidFor if not set
    const submitData = {
      ...data,
      paidBy: data.paidBy || data.paidFor,
      accessgiven: data.accessgiven ?? true,
    };
    await createMutation.mutateAsync(submitData);
  };



  // Sync paidBy with paidFor when client is selected
  useEffect(() => {
    if (paidFor && !watch('paidBy')) {
      setValue('paidBy', paidFor);
    }
  }, [paidFor, setValue, watch]);

  // Update amount when package is selected
  useEffect(() => {
    if (amountSource === 'package' && packageId) {
      const selectedPackage = packages.find((pkg: Package) => 
        (pkg._id === packageId || pkg.packageId === packageId)
      );
      if (selectedPackage) {
        setValue('amount', selectedPackage.price);
      }
    }
  }, [packageId, amountSource, packages, setValue]);

  // Month options - Last month, This month, Next month
  const monthOptions = useMemo(() => {
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    const thisMonth = now;
    const nextMonth = addMonths(now, 1);
    
    return [
      { label: 'Last month', value: format(lastMonth, 'MMMM') },
      { label: 'This month', value: format(thisMonth, 'MMMM') },
      { label: 'Next month', value: format(nextMonth, 'MMMM') },
    ];
  }, []);

  return (
    <Box px={{ base: 3, md: 6, lg: 8 }} py={{ base: 3, md: 6, lg: 8 }}>
      {/* Header */}
      <HStack justify="space-between" align="center" mb={{ base: 4, md: 5, lg: 6 }} flexWrap="wrap" gap={{ base: 3, md: 4 }}>
        <Box>
          <Heading size={{ base: 'xl', md: '2xl' }} mb={{ base: 1, md: 2 }}>
            Client Payments
          </Heading>
          <Text color="gray.600" fontSize="sm">
            Manage client payments and transactions
          </Text>
        </Box>
        <ModernButton
          colorPalette="blue"
          onClick={() => {
            reset();
            setIsCreateModalOpen(true);
          }}
          disabled={!isAdmin}
          aria-label="Add Payment"
        >
          <HiPlus />
          Add Payment
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
              placeholder="Search by payment ID, reference, client name, or month..."
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
                    <option value="PAID">PAID</option>
                    <option value="NOT_PAID">NOT PAID</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>

              {/* Extra Payment Filter */}
              <Field.Root>
                <Field.Label>Extra Payment</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={extraPaymentFilter}
                    onChange={(e) => setExtraPaymentFilter(e.target.value as ExtraPaymentFilter)}
                  >
                    <option value="all">All</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>

              {/* Access Given Filter */}
              <Field.Root>
                <Field.Label>Access Given</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={accessGivenFilter}
                    onChange={(e) => setAccessGivenFilter(e.target.value as AccessGivenFilter)}
                  >
                    <option value="all">All</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>

              {/* Month Filter */}
              <Field.Root>
                <Field.Label>Month</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                  >
                  <option value="">All Months</option>
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.value})
                    </option>
                  ))}
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

              {/* Min Amount Filter */}
              <Field.Root>
                <Field.Label>Min Amount</Field.Label>
                <Input
                  type="number"
                  value={minAmountFilter}
                  onChange={(e) => setMinAmountFilter(e.target.value)}
                  placeholder="Minimum amount"
                  min={0}
                  step="0.01"
                />
              </Field.Root>

              {/* Max Amount Filter */}
              <Field.Root>
                <Field.Label>Max Amount</Field.Label>
                <Input
                  type="number"
                  value={maxAmountFilter}
                  onChange={(e) => setMaxAmountFilter(e.target.value)}
                  placeholder="Maximum amount"
                  min={0}
                  step="0.01"
                />
              </Field.Root>
            </SimpleGrid>
          </Box>
        )}
      </Box>

      {/* Summary Section - Total Amount and Count */}
      {filteredTotal > 0 && (
        <Box mb={{ base: 3, md: 4 }} p={{ base: 3, md: 4 }} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.200">
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={{ base: 3, md: 4 }}>
            <VStack align="flex-start" gap={1}>
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Total Payments
              </Text>
              <Text fontSize="lg" fontWeight="semibold" color="gray.900">
                {filteredTotal} payment{filteredTotal !== 1 ? 's' : ''}
              </Text>
            </VStack>
            <VStack align="flex-end" gap={1}>
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Total Amount
              </Text>
              <Text fontSize="xl" fontWeight="bold" color="blue.600">
                {formatCurrency(totalAmount)}
              </Text>
            </VStack>
          </HStack>
        </Box>
      )}

      {/* Search Results Header */}
      {sanitizedSearch && (
        <Box mb={{ base: 3, md: 4 }}>
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
                    css={{
                      animation: 'spin 0.6s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                  <Text>Searching...</Text>
                </HStack>
              ) : (
                <>
                  Found <Text as="span" fontWeight="semibold" color="gray.900">{filteredTotal}</Text> payment{filteredTotal !== 1 ? 's' : ''} matching &quot;<Text as="span" fontWeight="semibold" color="gray.900">{sanitizedSearch}</Text>&quot;
                </>
              )}
            </Text>
          </HStack>
        </Box>
      )}

      {/* Payment Cards Grid */}
      <Box mb={6}>
        {isLoading && !((paymentsData as any)?.items?.length || (paymentsData as any)?.payments?.length) ? (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={4}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <PaymentCard key={i} payment={{} as Payment} isLoading={true} />
            ))}
          </SimpleGrid>
        ) : paginatedPayments.length === 0 ? (
          <Center py={12}>
            <VStack gap={3}>
              <Text fontSize="lg" color="gray.500" fontWeight="medium">
                {sanitizedSearch ? (
                  <>No payments found matching &quot;<Text as="span" fontWeight="semibold" color="gray.900">{sanitizedSearch}</Text>&quot;</>
                ) : (
                  'No payments found'
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
            {paginatedPayments.map((payment) => (
              <PaymentCard
                key={payment._id || payment.paymentId || payment.id}
                payment={payment}
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
          onPageSizeChange={handlePageSizeChange}
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
        title="Add Payment"
        submitLabel="Create"
        isLoading={isSubmitting || createMutation.isPending}
        isDisabled={isSubmitting || createMutation.isPending}
        size="lg"
      >
        <VStack gap={4} align="stretch">
          {/* Client (paidFor) - Searchable */}
          <Field.Root invalid={!!errors.paidFor}>
            <Field.Label>Client</Field.Label>
            <CustomerSearch
              value={paidFor}
              onSelect={(customerId) => {
                setValue('paidFor', customerId);
                // Auto-set paidBy to the selected client
                if (customerId) {
                  setValue('paidBy', customerId);
                }
              }}
              customers={customers}
              placeholder="Search client by name, email, phone, or client ID..."
              error={errors.paidFor?.message}
              invalid={!!errors.paidFor}
              aria-invalid={!!errors.paidFor}
              aria-describedby={errors.paidFor ? 'paidFor-error' : undefined}
            />
            {errors.paidFor && (
              <Field.ErrorText id="paidFor-error">{errors.paidFor.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Amount Source Toggle */}
          <Field.Root>
            <Field.Label>Amount Source</Field.Label>
            <RadioGroup.Root
              value={amountSource || 'package'}
              onValueChange={(e) => {
                const newValue = e.value as 'package' | 'manual';
                setValue('amountSource', newValue, { shouldValidate: true });
                if (newValue === 'manual') {
                  setValue('packageId', '', { shouldValidate: true });
                  setValue('amount', undefined, { shouldValidate: true });
                } else {
                  setValue('amount', undefined, { shouldValidate: true });
                }
              }}
            >
              <HStack gap={4}>
                <RadioGroup.Item value="package">
                  <RadioGroup.ItemControl />
                  <RadioGroup.ItemText>Package</RadioGroup.ItemText>
                </RadioGroup.Item>
                <RadioGroup.Item value="manual">
                  <RadioGroup.ItemControl />
                  <RadioGroup.ItemText>Manual Entry</RadioGroup.ItemText>
                </RadioGroup.Item>
              </HStack>
            </RadioGroup.Root>
            <input
              type="hidden"
              {...register('amountSource')}
            />
          </Field.Root>

          {/* Package Selection (when amountSource is 'package') */}
          {amountSource === 'package' && (
            <Field.Root invalid={!!errors.packageId}>
              <Field.Label>Package</Field.Label>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={{ base: 2, md: 3 }} mt={2}>
                {packages.map((pkg: Package) => {
                  const pkgId = pkg._id || pkg.packageId;
                  const isSelected = packageId === pkgId;
                  return (
                    <Box
                      key={pkgId}
                      p={4}
                      borderWidth="2px"
                      borderColor={isSelected ? 'blue.500' : 'gray.200'}
                      borderRadius="md"
                      cursor="pointer"
                      bg={isSelected ? 'blue.50' : 'white'}
                      _hover={{ borderColor: isSelected ? 'blue.600' : 'gray.300', bg: isSelected ? 'blue.50' : 'gray.50' }}
                      onClick={() => {
                        setValue('packageId', pkgId);
                        setValue('amount', pkg.price);
                      }}
                    >
                      <Text fontSize="sm" fontWeight="semibold" mb={1}>
                        {pkg.name || pkg.package_name}
                      </Text>
                      <Text fontSize="lg" fontWeight="bold" color="blue.600" mb={1}>
                        ${pkg.price?.toFixed(2) || '0.00'}
                      </Text>
                      <HStack gap={2} fontSize="xs" color="gray.600">
                        <Text>{pkg.durationDays} days</Text>
                        {pkg.sessions && (
                          <>
                            <Text>•</Text>
                            <Text>{pkg.sessions} sessions</Text>
                          </>
                        )}
                      </HStack>
                    </Box>
                  );
                })}
              </SimpleGrid>
              {errors.packageId && (
                <Field.ErrorText id="packageId-error" mt={2}>{errors.packageId.message}</Field.ErrorText>
              )}
              <input
                type="hidden"
                {...register('packageId')}
              />
            </Field.Root>
          )}

          {/* Manual Amount Entry (when amountSource is 'manual') */}
          {amountSource === 'manual' && (
            <Field.Root invalid={!!errors.amount}>
              <Field.Label>Amount</Field.Label>
              <Input
                type="number"
                {...register('amount', { valueAsNumber: true })}
                placeholder="0.00"
                min={0}
                step="0.01"
                aria-invalid={!!errors.amount}
                aria-describedby={errors.amount ? 'amount-error' : undefined}
              />
              {errors.amount && (
                <Field.ErrorText id="amount-error">{errors.amount.message}</Field.ErrorText>
              )}
            </Field.Root>
          )}

          {/* Month */}
          <Field.Root invalid={!!errors.month}>
            <Field.Label>Month</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                {...register('month')}
                aria-invalid={!!errors.month}
                aria-describedby={errors.month ? 'month-error' : undefined}
              >
                <option value="">Select month</option>
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.value})
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
            {errors.month && (
              <Field.ErrorText id="month-error">{errors.month.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Reference */}
          <Field.Root invalid={!!errors.reference}>
            <Field.Label>Reference</Field.Label>
            <Input
              {...register('reference')}
              placeholder="Payment reference"
              aria-invalid={!!errors.reference}
              aria-describedby={errors.reference ? 'reference-error' : undefined}
            />
            {errors.reference && (
              <Field.ErrorText id="reference-error">{errors.reference.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Payer (paidBy) - Defaults to Client, but can be changed */}
          <Field.Root invalid={!!errors.paidBy}>
            <Field.Label>Payer</Field.Label>
            <CustomerSearch
              value={watch('paidBy') || ''}
              onSelect={(customerId) => {
                setValue('paidBy', customerId);
              }}
              customers={customers}
              placeholder="Search payer by name, email, phone, or client ID..."
              error={errors.paidBy?.message}
              invalid={!!errors.paidBy}
              aria-invalid={!!errors.paidBy}
              aria-describedby={errors.paidBy ? 'paidBy-error' : undefined}
            />
            {paidFor && !watch('paidBy') && (
              <Text fontSize="xs" color="gray.600" mt={1}>
                Will default to selected client
              </Text>
            )}
            {errors.paidBy && (
              <Field.ErrorText id="paidBy-error">{errors.paidBy.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Is Extra Payment */}
          <Field.Root>
            <HStack justify="space-between">
              <Field.Label>Extra Payment</Field.Label>
              <Switch.Root
                checked={isExtra || false}
                onCheckedChange={(e) => {
                  setValue('isExtra', e.checked, { shouldValidate: true });
                }}
              >
                <Switch.Control />
              </Switch.Root>
            </HStack>
            <input
              type="hidden"
              {...register('isExtra')}
            />
          </Field.Root>

          {/* Session Quota (for extra payments) */}
          {isExtra && (
            <Field.Root invalid={!!errors.sessionQuota}>
              <Field.Label>Session Quota</Field.Label>
              <Input
                type="number"
                {...register('sessionQuota', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })}
                placeholder="Number of sessions"
                min={0}
                aria-invalid={!!errors.sessionQuota}
                aria-describedby={errors.sessionQuota ? 'sessionQuota-error' : undefined}
              />
              {errors.sessionQuota && (
                <Field.ErrorText id="sessionQuota-error">{errors.sessionQuota.message}</Field.ErrorText>
              )}
            </Field.Root>
          )}

          {/* Access Given - Hidden, defaults to true */}
          <input
            type="hidden"
            {...register('accessgiven', { value: true })}
          />

          {/* Payment History Table - Only show when customer is selected */}
          {paidFor && (
            <Box mt={4} pt={4} borderTopWidth="1px" borderColor="gray.200">
              <Text fontSize="sm" fontWeight="semibold" mb={3} color="gray.700">
                Payment History
              </Text>
              {isLoadingPaymentHistory ? (
                <VStack gap={2} align="stretch">
                  <Skeleton height="40px" />
                  <Skeleton height="40px" />
                  <Skeleton height="40px" />
                </VStack>
              ) : paymentHistoryError ? (
                <Text fontSize="sm" color="red.500" textAlign="center" py={4}>
                  Failed to load payment history. Please try again.
                </Text>
              ) : (() => {
                // Debug: Log response structure
                console.log('[Payment History] Rendering with data:', {
                  hasData: !!customerPaymentHistory,
                  dataType: typeof customerPaymentHistory,
                  isArray: Array.isArray(customerPaymentHistory),
                  length: customerPaymentHistory?.length || 0,
                  fullData: customerPaymentHistory,
                });
                
                // Backend returns: Payment[] (array directly from userPayments endpoint)
                // Ensure we always have an array, even if empty
                const payments: Payment[] = Array.isArray(customerPaymentHistory) 
                  ? customerPaymentHistory 
                  : [];
                
                console.log('[Payment History] Final payments to display:', payments.length);
                
                // Show table if we have payments, otherwise show empty state
                if (payments.length > 0) {
                  return (
                    <Box overflowX="auto" borderWidth="1px" borderColor="gray.200" borderRadius="md">
                      <Table.Root variant="outline" size="sm">
                        <Table.Header>
                          <Table.Row>
                            <Table.ColumnHeader>Payment Date</Table.ColumnHeader>
                            <Table.ColumnHeader>Month</Table.ColumnHeader>
                            <Table.ColumnHeader>Payment ID</Table.ColumnHeader>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {payments.slice(0, 10).map((payment: Payment) => (
                            <Table.Row key={payment._id || payment.paymentId || payment.id}>
                              <Table.Cell>
                                {formatDate(payment.createdAt || payment.paymentDate || payment.updatedAt, 'MMM dd, yyyy')}
                              </Table.Cell>
                              <Table.Cell>{payment.month || '-'}</Table.Cell>
                              <Table.Cell>
                                <Text fontSize="xs" fontFamily="mono">
                                  {payment.paymentId || payment.id || '-'}
                                </Text>
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Root>
                    </Box>
                  );
                }
                
                // Empty state - show when no payments found
                return (
                  <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                    No payment history found
                  </Text>
                );
              })()}
            </Box>
          )}
        </VStack>
      </ModalForm>

    </Box>
  );
}
