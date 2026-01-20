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
import { ModernButton } from '@/components/ui/ModernButton';
import { HiPlus, HiX, HiChevronDown, HiChevronUp, HiFilter, HiDocumentDownload } from 'react-icons/hi';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fetchCustomersList, createCustomer, updateCustomer, FetchCustomersParams } from '@/services/api/customers';
import { fetchPackages } from '@/services/api/packages';
import { Package } from '@/types/package';
import { queryKeys } from '@/services/api/queryKeys';
import { useIsAdmin } from '@/hooks/useRequireAdmin';
import { useToast } from '@/utils/toast';
import { getErrorMessage } from '@/utils/error';
import { SearchInput } from '@/components/ui/SearchInput';
import { ModalForm } from '@/components/ui/ModalForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Pagination } from '@/components/ui/Pagination';
import { Customer, IndividualCustomer } from '@/types/customer';
import { CustomerCard } from './components/CustomerCard';
import { createCustomerDtoSchema, updateCustomerDtoSchema } from '@/services/api/input-validators';
import * as prefetchers from '@/routes/prefetchers';
import { generateCustomersPDF, AVAILABLE_PDF_FIELDS } from '@/utils/pdfGenerator';
import { getGymNameFromToken, getUserNameFromToken } from '@/utils/jwt';
import { STORAGE_KEYS } from '@/utils/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useSearch } from '@/contexts/SearchContext';
import { parseNIC } from '@/utils/nicParser';
import { formatPhoneNumber, normalizePhoneForDisplay } from '@/utils/phoneFormatter';
import { capitalizeName } from '@/utils/stringUtils';

/**
 * Type guard to check if customer is IndividualCustomer
 */
function isIndividualCustomer(customer: Customer | IndividualCustomer): customer is IndividualCustomer {
  return 'firstName' in customer && 'clientId' in customer;
}

/**
 * Get clientId from customer (replaces _id)
 */
function getClientId(customer: Customer | IndividualCustomer): string {
  if ('clientId' in customer && customer.clientId) {
    return customer.clientId;
  }
  return '';
}

// Form validation schema - matches API requirements
const customerFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  nic: z.string().regex(/^([0-9]{9}[vVxX]|[0-9]{12})$/, 'Invalid NIC format. Use 9 digits + V/v (e.g., 123456789V) or 12 digits (e.g., 123456789012)'),
  phone: z.string().regex(/^(\+?94[0-9]{9}|0[0-9]{9}|[0-9]{10,15})$/, 'Invalid phone number. Use format: 0771234567 or +94771234567'),
  email: z.string().email('Invalid email'),
  addressLine1: z.string().min(1, 'Address line 1 is required').max(200),
  addressLine2: z.string().min(1, 'Address line 2 is required').max(200),
  packageId: z.string().min(1, 'Package is required'),
  isMale: z.boolean(),
  dob: z.string().min(1, 'Date of birth is required'),
  isMarried: z.boolean().optional(),
  whyJoin: z.enum(['Bulking', 'Strength', 'Fatloss', 'Regular Fitness', 'Extreme Training', 'Athletic'], {
    required_error: 'Why join is required',
  }),
  profession: z.string().max(100).optional(),
  reference: z.string().max(200).optional(),
  deactivateAt: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

export default function CustomersPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const isAdmin = useIsAdmin();
  const { user } = useAuth();
  const { searchQuery, setSearchQuery } = useSearch();

  // State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [selectedPDFFields, setSelectedPDFFields] = useState<string[]>(['clientId', 'name', 'email', 'mobileNumber']);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isFPConfirmDialogOpen, setIsFPConfirmDialogOpen] = useState(false);
  const [selectedCustomerForFP, setSelectedCustomerForFP] = useState<Customer | IndividualCustomer | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'individual' | 'group'>('all');
  const [packageFilter, setPackageFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
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
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      nic: '',
      phone: '',
      email: '',
      addressLine1: '',
      addressLine2: '',
      packageId: '',
      isMale: true,
      dob: '',
      isMarried: false,
      whyJoin: undefined as 'Bulking' | 'Strength' | 'Fatloss' | 'Regular Fitness' | 'Extreme Training' | 'Athletic' | undefined,
      profession: '',
      reference: '',
      deactivateAt: '',
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
    const params: FetchCustomersParams = {
      page,
      size: pageSize,
      searchTerm: sanitizedSearch,
    };
    
    if (typeFilter !== 'all') {
      params.type = typeFilter;
    }
    
    return params;
  }, [page, pageSize, sanitizedSearch, typeFilter]);

  // Fetch customers list
  const { data: customersData, isLoading, refetch, isFetching } = useQuery({
    queryKey: queryKeys.customers.list(queryParams),
    queryFn: async () => {
      setIsSearching(true);
      try {
        const result = await fetchCustomersList(queryParams);
        return result;
      } finally {
        setIsSearching(false);
      }
    },
    staleTime: 60000, // 1 minute
    placeholderData: (previousData) => previousData,
    enabled: true, // Always enabled, but we handle empty search
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
  const performClientSideSearch = useCallback((customers: (Customer | IndividualCustomer)[], searchTerm: string): (Customer | IndividualCustomer)[] => {
    if (!searchTerm || searchTerm.length < 2) return customers;
    
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const searchTerms = normalizedSearch.split(/\s+/).filter(term => term.length > 0);
    
    return customers.filter((customer) => {
      // Get searchable fields
      const firstName = ('firstName' in customer && customer.firstName) 
        ? customer.firstName.toLowerCase() 
        : ('name' in customer && customer.name) 
          ? customer.name.split(' ')[0]?.toLowerCase() || ''
          : '';
      const lastName = ('lastName' in customer && customer.lastName)
        ? customer.lastName.toLowerCase()
        : ('name' in customer && customer.name)
          ? customer.name.split(' ').slice(1).join(' ')?.toLowerCase() || ''
          : '';
      const fullName = `${firstName} ${lastName}`.trim();
      const email = customer.email?.toLowerCase() || '';
      const mobileNumber = customer.mobileNumber?.toLowerCase() || '';
      const clientId = ('clientId' in customer && customer.clientId)
        ? customer.clientId.toLowerCase()
        : '';
      const nic = ('nic' in customer && customer.nic)
        ? customer.nic.toLowerCase()
        : '';
      const reference = ('reference' in customer && customer.reference)
        ? customer.reference.toLowerCase()
        : '';
      
      // Combine all searchable text
      const searchableText = `${fullName} ${email} ${mobileNumber} ${clientId} ${nic} ${reference}`.toLowerCase();
      
      // Check if all search terms match (AND logic for multiple terms)
      return searchTerms.every(term => searchableText.includes(term));
    });
  }, []);

  // Apply client-side filters (status, package, payment, date range) and search
  const filteredCustomers = useMemo(() => {
    if (!customersData?.customers) return [];
    
    // First apply client-side search if we have a search term
    // This acts as a fallback if API search doesn't work properly
    let customers = customersData.customers;
    if (sanitizedSearch) {
      // Apply client-side search as additional filtering
      customers = performClientSideSearch(customers, sanitizedSearch);
    }
    
    // Then apply other filters
    return customers.filter((customer) => {
      // Status filter - works for both Customer and IndividualCustomer
      if (statusFilter !== 'all') {
        const isActive = customer.isActive ?? true;
        if (statusFilter === 'active' && !isActive) return false;
        if (statusFilter === 'inactive' && isActive) return false;
      }
      
      // Package filter - works for both types
      if (packageFilter !== 'all' && customer.packageId !== packageFilter) {
        return false;
      }
      
      // Payment status filter - works for both types
      if (paymentStatusFilter !== 'all') {
        const isPaid = customer.isPaid ?? false;
        if (paymentStatusFilter === 'paid' && !isPaid) return false;
        if (paymentStatusFilter === 'unpaid' && isPaid) return false;
      }
      
      // Date range filter - works for both types (both have createdAt)
      if (dateFrom || dateTo) {
        // Both Customer and IndividualCustomer have createdAt
        const customerDate = customer.createdAt ? new Date(customer.createdAt) : null;
        if (customerDate) {
          if (dateFrom && customerDate < new Date(dateFrom)) return false;
          if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999); // Include entire end date
            if (customerDate > toDate) return false;
          }
        }
      }
      
      return true;
    });
  }, [customersData?.customers, statusFilter, packageFilter, paymentStatusFilter, dateFrom, dateTo, sanitizedSearch, performClientSideSearch]);

  // Check if we have active client-side filters (filters not sent to API)
  const hasClientSideFilters = useMemo(() => {
    return (
      statusFilter !== 'all' ||
      packageFilter !== 'all' ||
      paymentStatusFilter !== 'all' ||
      dateFrom !== '' ||
      dateTo !== ''
    );
  }, [statusFilter, packageFilter, paymentStatusFilter, dateFrom, dateTo]);

  // Calculate filtered total and pages
  // When client-side filters are active, we filter the current page's data
  // When no client-side filters, use API total for accurate pagination
  const filteredTotal = hasClientSideFilters 
    ? filteredCustomers.length 
    : (customersData?.total ?? 0);
  
  // For client-side filters, we need to paginate the filtered results
  // For server-side only, the API already paginates, so we use all filtered customers
  const paginatedCustomers = useMemo(() => {
    if (hasClientSideFilters) {
      // Client-side pagination: slice the filtered results
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      return filteredCustomers.slice(start, end);
    } else {
      // Server-side pagination: use all filtered customers (API already paginated)
      return filteredCustomers;
    }
  }, [filteredCustomers, page, pageSize, hasClientSideFilters]);

  // Calculate total pages
  // When client-side filters are active, calculate from filtered count
  // When no client-side filters, use API total
  const filteredTotalPages = useMemo(() => {
    if (hasClientSideFilters) {
      // Client-side filtering: calculate pages from filtered count
      return Math.ceil(filteredCustomers.length / pageSize);
    } else {
      // Server-side pagination: use API total
      const apiTotal = customersData?.total ?? 0;
      return Math.ceil(apiTotal / pageSize);
    }
  }, [filteredCustomers.length, pageSize, hasClientSideFilters, customersData?.total]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (typeFilter !== 'all') count++;
    if (packageFilter !== 'all') count++;
    if (paymentStatusFilter !== 'all') count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    return count;
  }, [statusFilter, typeFilter, packageFilter, paymentStatusFilter, dateFrom, dateTo]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setStatusFilter('all');
    setTypeFilter('all');
    setPackageFilter('all');
    setPaymentStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }, []);

  // Fetch packages for dropdown
  const { data: packages } = useQuery({
    queryKey: queryKeys.packages.list(),
    queryFn: fetchPackages,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      // Map form data to API payload structure
      const apiPayload = {
        firstName: data.firstName,
        lastName: data.lastName,
        nic: data.nic,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        email: data.email,
        mobileNumber: data.phone,
        packageId: data.packageId,
        isMale: data.isMale,
        dob: data.dob,
        isMarried: data.isMarried,
        whyJoin: data.whyJoin,
        profession: data.profession,
        reference: data.reference,
      };
      
      // Validate using Zod schema with better error handling
      const validationResult = createCustomerDtoSchema.safeParse(apiPayload);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new Error(`Validation failed: ${errorMessages}`);
      }
      
      return createCustomer(validationResult.data);
    },
    onSuccess: () => {
      toast.create({
        title: 'Success',
        description: 'Customer created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsCreateModalOpen(false);
      reset();
      qc.invalidateQueries({ queryKey: queryKeys.customers.all });
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
    mutationFn: async ({ id, data }: { id: string; data: CustomerFormData }) => {
      // Map form data to API payload structure
      const apiPayload = {
        updatedAt: new Date().toISOString(),
        firstName: data.firstName,
        lastName: data.lastName,
        nic: data.nic,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        email: data.email,
        mobileNumber: data.phone,
        packageId: data.packageId,
        isMale: data.isMale,
        dob: data.dob,
        isMarried: data.isMarried,
        whyJoin: data.whyJoin,
        profession: data.profession,
        reference: data.reference,
        deactivateAt: data.deactivateAt || undefined,
        isActive: selectedCustomer?.isActive ?? true,
      };
      
      // Validate using Zod schema with better error handling
      const validationResult = updateCustomerDtoSchema.safeParse(apiPayload);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new Error(`Validation failed: ${errorMessages}`);
      }
      
      return updateCustomer(id, validationResult.data);
    },
    onSuccess: () => {
      toast.create({
        title: 'Success',
        description: 'Customer updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsEditModalOpen(false);
      setSelectedCustomer(null);
      reset();
      qc.invalidateQueries({ queryKey: queryKeys.customers.all });
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


  // Update FP status mutation
  const updateFPStatusMutation = useMutation({
    mutationFn: async (customer: Customer | IndividualCustomer) => {
      const clientId = getClientId(customer);
      if (!clientId) {
        throw new Error('Customer ID is required');
      }
      return updateCustomer(clientId, { 
        updatedAt: new Date().toISOString(),
        isActive: customer.isActive ?? true,
        isOnFPmachine: false 
      });
    },
    onSuccess: () => {
      toast.create({
        title: 'Success',
        description: 'Customer reset on fingerprint machine successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      qc.invalidateQueries({ queryKey: queryKeys.customers.all });
      refetch();
    },
    onError: (error: any) => {
      // Refresh customer list on 404 to ensure we have the latest data
      if (error?.status === 404 || error?.response?.status === 404) {
        qc.invalidateQueries({ queryKey: queryKeys.customers.all });
        refetch();
        setIsFPConfirmDialogOpen(false);
        setSelectedCustomerForFP(null);
        toast.create({
          title: 'Customer Not Found',
          description: 'This customer no longer exists. The customer list has been refreshed.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast.create({
          title: 'Error',
          description: getErrorMessage(error),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    },
  });

  useEffect(() => {
    document.title = 'Customers • PayZhe';
    prefetchers.prefetchCustomers(qc);
  }, [qc]);

  // Debug logging (development only) - log first customer to verify data structure
  useEffect(() => {
    if (import.meta.env.DEV && customersData?.customers && customersData.customers.length > 0) {
      console.log('[CustomersPage] First customer data structure:', customersData.customers[0]);
      console.log('[CustomersPage] Is IndividualCustomer?', isIndividualCustomer(customersData.customers[0]));
      console.log('[CustomersPage] Total customers:', customersData.customers.length);
    }
  }, [customersData]);

  // Handle search - use global search state
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1); // Reset to first page on search
  }, [setSearchQuery]);

  const handleDebouncedSearchChange = useCallback((value: string) => {
    setDebouncedSearch(value);
    setPage(1); // Reset to first page on debounced search
  }, []);

  // Handle create form submit
  const handleCreateSubmit = async (data: CustomerFormData) => {
    // Format phone number before submission
    const formattedData = {
      ...data,
      phone: formatPhoneNumber(data.phone)
    };
    await createMutation.mutateAsync(formattedData);
  };

  // Handle edit form submit
  const handleEditSubmit = async (data: CustomerFormData) => {
    if (selectedCustomer) {
      // Format phone number before submission
      const formattedData = {
        ...data,
        phone: formatPhoneNumber(data.phone)
      };
      await updateMutation.mutateAsync({ id: getClientId(selectedCustomer), data: formattedData });
    }
  };

  // Handle NIC change to auto-fill gender and DOB
  const handleNICChange = (nic: string) => {
    // Try to parse NIC and auto-fill gender and DOB
    if (nic.length >= 10) { // Minimum valid NIC length
      const parseResult = parseNIC(nic);
      if (parseResult.isValid) {
        setValue('isMale', parseResult.gender);
        setValue('dob', parseResult.dob);
      }
    }
  };

  // Open edit modal
  const handleEdit = (customer: Customer | IndividualCustomer) => {
    setSelectedCustomer(customer as Customer);
    
    // Extract firstName and lastName
    let firstName = '';
    let lastName = '';
    if ('firstName' in customer && customer.firstName) {
      firstName = customer.firstName;
      lastName = customer.lastName || '';
    } else if ('name' in customer && customer.name) {
      const nameParts = customer.name.split(' ') || ['', ''];
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }
    
    // Populate all form fields
    setValue('firstName', firstName);
    setValue('lastName', lastName);
    setValue('phone', normalizePhoneForDisplay(customer.mobileNumber || ''));
    setValue('email', customer.email || '');
    setValue('packageId', customer.packageId || '');
    
    // Populate new fields from IndividualCustomer type if available
    if ('nic' in customer) {
      setValue('nic', (customer as IndividualCustomer).nic || '');
      setValue('addressLine1', (customer as IndividualCustomer).addressLine1 || '');
      setValue('addressLine2', (customer as IndividualCustomer).addressLine2 || '');
      setValue('isMale', (customer as IndividualCustomer).isMale ?? true);
      setValue('dob', (customer as IndividualCustomer).dob ? format(new Date((customer as IndividualCustomer).dob), 'yyyy-MM-dd') : '');
      setValue('isMarried', (customer as IndividualCustomer).isMarried ?? false);
      const whyJoinValue = (customer as IndividualCustomer).whyJoin;
      const validWhyJoinOptions: ('Bulking' | 'Strength' | 'Fatloss' | 'Regular Fitness' | 'Extreme Training' | 'Athletic')[] = ['Bulking', 'Strength', 'Fatloss', 'Regular Fitness', 'Extreme Training', 'Athletic'];
      if (whyJoinValue && validWhyJoinOptions.includes(whyJoinValue as any)) {
        setValue('whyJoin', whyJoinValue as 'Bulking' | 'Strength' | 'Fatloss' | 'Regular Fitness' | 'Extreme Training' | 'Athletic');
      } else {
        setValue('whyJoin', undefined as any);
      }
      setValue('profession', (customer as IndividualCustomer).profession || '');
      setValue('reference', (customer as IndividualCustomer).reference || '');
      const deactivateAtValue = (customer as IndividualCustomer).deactivateAt;
      setValue('deactivateAt', deactivateAtValue ? format(new Date(deactivateAtValue), 'yyyy-MM-dd') : '');
    } else {
      // Set defaults for missing fields
      setValue('nic', '');
      setValue('addressLine1', '');
      setValue('addressLine2', '');
      setValue('isMale', true);
      setValue('dob', '');
      setValue('isMarried', false);
      setValue('whyJoin', undefined as any);
      setValue('profession', '');
      setValue('reference', '');
      setValue('deactivateAt', '');
    }
    
    setIsEditModalOpen(true);
    setActionMenuOpen(null);
  };


  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, packageFilter, paymentStatusFilter, dateFrom, dateTo]);

  // Handle PDF field selection - using CheckboxGroup pattern
  const handlePDFFieldsChange = (values: string[]) => {
    setSelectedPDFFields(values);
  };

  const handleSelectAllPDFFields = () => {
    setSelectedPDFFields(AVAILABLE_PDF_FIELDS.map(f => f.id));
  };

  const handleDeselectAllPDFFields = () => {
    setSelectedPDFFields([]);
  };

  // Generate PDF
  const handleGeneratePDF = () => {
    if (selectedPDFFields.length === 0) {
      toast.create({
        title: 'Error',
        description: 'Please select at least one field to include in the PDF',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (filteredCustomers.length === 0) {
      toast.create({
        title: 'Error',
        description: 'No customers to generate PDF for',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Get token and extract info
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const gymName = token ? (getGymNameFromToken(token) || 'Unknown Gym') : 'Unknown Gym';
      const userName = token ? (getUserNameFromToken(token) || user?.name || 'Unknown User') : (user?.name || 'Unknown User');
      const reportDate = new Date();

      // Get selected fields
      const selectedFields = AVAILABLE_PDF_FIELDS.filter(field => selectedPDFFields.includes(field.id));

      // Generate PDF
      generateCustomersPDF({
        fields: selectedFields,
        customers: filteredCustomers,
        gymName,
        userName,
        reportDate,
      });

      toast.create({
        title: 'Success',
        description: 'PDF generated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setIsPDFModalOpen(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.create({
        title: 'Error',
        description: getErrorMessage(error),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box px={{ base: 3, md: 6, lg: 8 }} py={{ base: 3, md: 6, lg: 8 }}>
      {/* Header */}
      <HStack justify="space-between" align="center" mb={{ base: 4, md: 5, lg: 6 }} flexWrap="wrap" gap={{ base: 3, md: 4 }}>
        <Box>
          <Heading size={{ base: 'xl', md: '2xl' }} mb={{ base: 1, md: 2 }}>
            Customers
          </Heading>
          <Text color="gray.600" fontSize={{ base: 'sm', md: 'md' }}>
            Manage gym members and groups
          </Text>
        </Box>
        <HStack gap={2}>
          <ModernButton
            colorPalette="green"
            onClick={() => setIsPDFModalOpen(true)}
            aria-label="Generate PDF"
          >
            <HiDocumentDownload />
            Generate PDF
          </ModernButton>
          <ModernButton
            colorPalette="blue"
            onClick={() => {
              reset();
              setIsCreateModalOpen(true);
            }}
            disabled={!isAdmin}
            aria-label="Add Customer"
          >
            <HiPlus />
            Add Customer
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
              placeholder="Search by name, email, phone, client ID, NIC, or reference... (Ctrl+K)"
              debounceDelay={400}
              isLoading={isSearching || isLoading}
              minLength={2}
            />
          </Box>
          {sanitizedSearch && (
            <HStack gap={{ base: 2, md: 2 }}>
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
      <Box mb={6} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
        {/* Filter Header - Always Visible */}
        <Box
          p={4}
          cursor="pointer"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          _hover={{ bg: 'gray.100' }}
          transition="background-color 0.2s"
        >
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
            <HStack gap={{ base: 2, md: 2 }}>
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
            <HStack gap={{ base: 2, md: 2 }}>
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
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={{ base: 3, md: 4, lg: 5 }}>
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
              <Field.Label>Customer Type</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as 'all' | 'individual' | 'group')}
                >
                  <option value="all">All Types</option>
                  <option value="individual">Individual</option>
                  <option value="group">Group</option>
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Field.Root>

            {/* Package Filter */}
            <Field.Root>
              <Field.Label>Package</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={packageFilter}
                  onChange={(e) => setPackageFilter(e.target.value)}
                >
                  <option value="all">All Packages</option>
                  {packages?.map((pkg) => (
                    <option key={pkg._id || pkg.packageId} value={pkg._id || pkg.packageId}>
                      {pkg.name || pkg.package_name || 'Unnamed Package'}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Field.Root>

            {/* Payment Status Filter */}
            <Field.Root>
              <Field.Label>Payment Status</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value as 'all' | 'paid' | 'unpaid')}
                >
                  <option value="all">All Payments</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
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
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={{ base: 2, md: 2 }}>
            <Text fontSize="sm" color="gray.600">
              {isSearching ? (
                <HStack gap={{ base: 2, md: 2 }}>
                  <Box
                    as="span"
                    display="inline-block"
                    width="12px"
                    height="12px"
                    border="2px solid"
                    borderColor="blue.500"
                    borderTopColor="transparent"
                    borderRadius="full"
                    style={{
                      animation: 'spin 0.6s linear infinite',
                    }}
                  />
                  <Text>Searching...</Text>
                </HStack>
              ) : (
                <>
                  Found <Text as="span" fontWeight="semibold" color="gray.900">{filteredTotal}</Text> customer{filteredTotal !== 1 ? 's' : ''} matching &quot;<Text as="span" fontWeight="semibold" color="gray.900">{sanitizedSearch}</Text>&quot;
                </>
              )}
            </Text>
          </HStack>
        </Box>
      )}

      {/* Customer Cards Grid */}
      <Box mb={{ base: 4, md: 5, lg: 6 }}>
        {isLoading && !customersData ? (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={{ base: 3, md: 4, lg: 5 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <CustomerCard key={i} customer={{} as Customer} isLoading={true} />
            ))}
          </SimpleGrid>
        ) : paginatedCustomers.length === 0 ? (
          <Center py={12}>
            <VStack gap={3}>
              <Text fontSize="lg" color="gray.500" fontWeight="medium">
                {sanitizedSearch ? (
                  <>No customers found matching &quot;<Text as="span" fontWeight="semibold" color="gray.900">{sanitizedSearch}</Text>&quot;</>
                ) : (
                  'No customers found'
                )}
              </Text>
              <HStack gap={{ base: 2, md: 2 }}>
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
            {paginatedCustomers.map((customer) => (
              <CustomerCard
                key={getClientId(customer)}
                customer={customer}
                onEdit={handleEdit}
                actionMenuOpen={actionMenuOpen}
                onActionMenuChange={setActionMenuOpen}
                onOpenFPConfirm={(customer) => {
                  setSelectedCustomerForFP(customer);
                  setIsFPConfirmDialogOpen(true);
                }}
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
        title="Add Customer"
        submitLabel="Create"
        isLoading={isSubmitting || createMutation.isPending}
        isDisabled={isSubmitting || createMutation.isPending}
        size="lg"
      >
        <VStack gap={{ base: 4, md: 5, lg: 6 }} align="stretch">
          {/* Section 1: Personal Information */}
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
              Personal Information
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: 3, md: 4 }}>
              {/* First Name */}
              <Field.Root invalid={!!errors.firstName}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  First Name *
                </Field.Label>
                <Input
                  {...register('firstName')}
                  onChange={(e) => {
                    const capitalized = capitalizeName(e.target.value);
                    setValue('firstName', capitalized);
                  }}
                  placeholder="John"
                  aria-invalid={!!errors.firstName}
                  aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  py={{ base: 3, md: 3.5 }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.firstName && (
                  <Field.ErrorText id="firstName-error">{errors.firstName.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* Last Name */}
              <Field.Root invalid={!!errors.lastName}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Last Name *
                </Field.Label>
                <Input
                  {...register('lastName')}
                  onChange={(e) => {
                    const capitalized = capitalizeName(e.target.value);
                    setValue('lastName', capitalized);
                  }}
                  placeholder="Doe"
                  aria-invalid={!!errors.lastName}
                  aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  py={{ base: 3, md: 3.5 }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.lastName && (
                  <Field.ErrorText id="lastName-error">{errors.lastName.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* NIC */}
              <Field.Root invalid={!!errors.nic} gridColumn={{ base: '1', md: '1 / -1' }}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  NIC (National Identity Card) *
                </Field.Label>
                <Input
                  {...register('nic')}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    setValue('nic', value);
                    handleNICChange(value);
                  }}
                  placeholder="123456789V or 199512345678"
                  aria-invalid={!!errors.nic}
                  aria-describedby={errors.nic ? 'nic-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  py={{ base: 3, md: 3.5 }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.nic && (
                  <Field.ErrorText id="nic-error">{errors.nic.message}</Field.ErrorText>
                )}
                {watch('nic') && parseNIC(watch('nic')).isValid && (
                  <Text fontSize="xs" color="green.600" mt={1}>
                    ✓ Gender and birthdate auto-filled from NIC
                  </Text>
                )}
              </Field.Root>

              {/* Gender */}
              <Field.Root invalid={!!errors.isMale}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Gender *
                </Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={watch('isMale') ? 'true' : 'false'}
                    onChange={(e) => setValue('isMale', e.target.value === 'true')}
                    aria-invalid={!!errors.isMale}
                    borderRadius="xl"
                    borderWidth="2px"
                    borderColor="gray.200"
                    bg="white"
                    minH={{ base: '48px', md: '52px' }}
                    py={{ base: 3, md: 3.5 }}
                    fontSize={{ base: '16px', md: 'md' }}
                    _hover={{ borderColor: 'gray.300' }}
                    _focus={{
                      borderColor: 'blue.500',
                      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                    }}
                    _invalid={{ borderColor: 'red.500' }}
                  >
                    <option value="true">Male</option>
                    <option value="false">Female</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
                {errors.isMale && (
                  <Field.ErrorText>{errors.isMale.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* Marital Status */}
              <Field.Root invalid={!!errors.isMarried}>
                <Field.Label fontWeight="semibold" color="gray.600" mb={2.5}>
                  Marital Status (Optional)
                </Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={watch('isMarried') ? 'true' : 'false'}
                    onChange={(e) => setValue('isMarried', e.target.value === 'true')}
                    aria-invalid={!!errors.isMarried}
                    borderRadius="xl"
                    borderWidth="2px"
                    borderColor="gray.200"
                    bg="white"
                    minH={{ base: '48px', md: '52px' }}
                    py={{ base: 3, md: 3.5 }}
                    fontSize={{ base: '16px', md: 'md' }}
                    _hover={{ borderColor: 'gray.300' }}
                    _focus={{
                      borderColor: 'blue.500',
                      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                    }}
                    _invalid={{ borderColor: 'red.500' }}
                  >
                    <option value="false">Single</option>
                    <option value="true">Married</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
                {errors.isMarried && (
                  <Field.ErrorText>{errors.isMarried.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* Date of Birth */}
              <Field.Root invalid={!!errors.dob} gridColumn={{ base: '1', md: '1 / -1' }}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Date of Birth *
                </Field.Label>
                <Input
                  type="date"
                  {...register('dob')}
                  aria-invalid={!!errors.dob}
                  aria-describedby={errors.dob ? 'dob-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  py={{ base: 3, md: 3.5 }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.dob && (
                  <Field.ErrorText id="dob-error">{errors.dob.message}</Field.ErrorText>
                )}
              </Field.Root>
            </SimpleGrid>
          </Box>

          {/* Section 2: Contact Information */}
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
              Contact Information
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: 3, md: 4 }}>
              {/* Phone */}
              <Field.Root invalid={!!errors.phone}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Phone *
                </Field.Label>
                <Input
                  type="tel"
                  {...register('phone')}
                  placeholder="0712345678"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  py={{ base: 3, md: 3.5 }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.phone && (
                  <Field.ErrorText id="phone-error">{errors.phone.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* Email */}
              <Field.Root invalid={!!errors.email}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Email *
                </Field.Label>
                <Input
                  type="email"
                  {...register('email')}
                  placeholder="john@example.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  py={{ base: 3, md: 3.5 }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.email && (
                  <Field.ErrorText id="email-error">{errors.email.message}</Field.ErrorText>
                )}
              </Field.Root>
            </SimpleGrid>
          </Box>

          {/* Section 3: Address */}
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
              Address
            </Heading>
            <SimpleGrid columns={{ base: 1 }} gap={{ base: 3, md: 4 }}>
              {/* Address Line 1 */}
              <Field.Root invalid={!!errors.addressLine1}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Address Line 1 *
                </Field.Label>
                <Input
                  {...register('addressLine1')}
                  placeholder="Street address"
                  aria-invalid={!!errors.addressLine1}
                  aria-describedby={errors.addressLine1 ? 'addressLine1-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  py={{ base: 3, md: 3.5 }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.addressLine1 && (
                  <Field.ErrorText id="addressLine1-error">{errors.addressLine1.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* Address Line 2 */}
              <Field.Root invalid={!!errors.addressLine2}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Address Line 2 *
                </Field.Label>
                <Input
                  {...register('addressLine2')}
                  placeholder="Apartment, suite, etc."
                  aria-invalid={!!errors.addressLine2}
                  aria-describedby={errors.addressLine2 ? 'addressLine2-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  py={{ base: 3, md: 3.5 }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.addressLine2 && (
                  <Field.ErrorText id="addressLine2-error">{errors.addressLine2.message}</Field.ErrorText>
                )}
              </Field.Root>
            </SimpleGrid>
          </Box>

          {/* Section 4: Package & Additional Information */}
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
              Package & Additional Information
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: 3, md: 4 }}>
              {/* Package */}
              <Field.Root invalid={!!errors.packageId} gridColumn={{ base: '1', md: '1 / -1' }}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Package *
                </Field.Label>
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={{ base: 2, md: 3 }} mt={2}>
                  {packages?.map((pkg: Package) => {
                    const pkgId = pkg._id || pkg.packageId;
                    const currentPackageId = watch('packageId');
                    // Check if this package matches the selected packageId (handles both _id and packageId formats)
                    const isSelected = currentPackageId === pkgId || 
                                      currentPackageId === pkg._id || 
                                      currentPackageId === pkg.packageId;
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

              {/* Profession */}
              <Field.Root invalid={!!errors.profession}>
                <Field.Label fontWeight="semibold" color="gray.600" mb={2.5}>
                  Profession (Optional)
                </Field.Label>
                <Input
                  {...register('profession')}
                  placeholder="Engineer, Teacher, etc."
                  aria-invalid={!!errors.profession}
                  aria-describedby={errors.profession ? 'profession-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  py={{ base: 3, md: 3.5 }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.profession && (
                  <Field.ErrorText id="profession-error">{errors.profession.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* Why Join */}
              <Field.Root invalid={!!errors.whyJoin}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Why Join? *
                </Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    {...register('whyJoin')}
                    aria-invalid={!!errors.whyJoin}
                    aria-describedby={errors.whyJoin ? 'whyJoin-error' : undefined}
                    borderRadius="xl"
                    borderWidth="2px"
                    borderColor="gray.200"
                    bg="white"
                    minH={{ base: '48px', md: '52px' }}
                    py={{ base: 3, md: 3.5 }}
                    fontSize={{ base: '16px', md: 'md' }}
                    _hover={{ borderColor: 'gray.300' }}
                    _focus={{
                      borderColor: 'blue.500',
                      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                    }}
                    _invalid={{ borderColor: 'red.500' }}
                  >
                    <option value="">Select a reason</option>
                    <option value="Bulking">Bulking</option>
                    <option value="Strength">Strength</option>
                    <option value="Fatloss">Fatloss</option>
                    <option value="Regular Fitness">Regular Fitness</option>
                    <option value="Extreme Training">Extreme Training</option>
                    <option value="Athletic">Athletic</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
                {errors.whyJoin && (
                  <Field.ErrorText id="whyJoin-error">{errors.whyJoin.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* Reference */}
              <Field.Root invalid={!!errors.reference}>
                <Field.Label fontWeight="semibold" color="gray.600" mb={2.5}>
                  Reference (Optional)
                </Field.Label>
                <Input
                  {...register('reference')}
                  placeholder="How did you hear about us?"
                  aria-invalid={!!errors.reference}
                  aria-describedby={errors.reference ? 'reference-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  py={{ base: 3, md: 3.5 }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.reference && (
                  <Field.ErrorText id="reference-error">{errors.reference.message}</Field.ErrorText>
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
          setSelectedCustomer(null);
          reset();
        }}
        onSubmit={handleSubmit(handleEditSubmit)}
        title="Edit Customer"
        submitLabel="Save"
        isLoading={isSubmitting || updateMutation.isPending}
        isDisabled={isSubmitting || updateMutation.isPending}
        size="lg"
      >
        <VStack gap={{ base: 4, md: 5, lg: 6 }} align="stretch">
          {/* Section 1: Personal Information */}
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
              Personal Information
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: 3, md: 4 }}>
              {/* First Name */}
              <Field.Root invalid={!!errors.firstName}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  First Name *
                </Field.Label>
                <Input
                  {...register('firstName')}
                  onChange={(e) => {
                    const capitalized = capitalizeName(e.target.value);
                    setValue('firstName', capitalized);
                  }}
                  placeholder="John"
                  aria-invalid={!!errors.firstName}
                  aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  py={{ base: 3, md: 3.5 }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.firstName && (
                  <Field.ErrorText id="firstName-error">{errors.firstName.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* Last Name */}
              <Field.Root invalid={!!errors.lastName}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Last Name *
                </Field.Label>
                <Input
                  {...register('lastName')}
                  onChange={(e) => {
                    const capitalized = capitalizeName(e.target.value);
                    setValue('lastName', capitalized);
                  }}
                  placeholder="Doe"
                  aria-invalid={!!errors.lastName}
                  aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  py={{ base: 3, md: 3.5 }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.lastName && (
                  <Field.ErrorText id="lastName-error">{errors.lastName.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* NIC */}
              <Field.Root invalid={!!errors.nic} gridColumn={{ base: '1', md: '1 / -1' }}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  NIC (National Identity Card) *
                </Field.Label>
                <Input
                  {...register('nic')}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    setValue('nic', value);
                    handleNICChange(value);
                  }}
                  placeholder="123456789V or 199512345678"
                  aria-invalid={!!errors.nic}
                  aria-describedby={errors.nic ? 'nic-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  py={{ base: 3, md: 3.5 }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.nic && (
                  <Field.ErrorText id="nic-error">{errors.nic.message}</Field.ErrorText>
                )}
                {watch('nic') && parseNIC(watch('nic')).isValid && (
                  <Text fontSize="xs" color="green.600" mt={1}>
                    ✓ Gender and birthdate auto-filled from NIC
                  </Text>
                )}
              </Field.Root>

              {/* Gender */}
              <Field.Root invalid={!!errors.isMale}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Gender *
                </Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={watch('isMale') ? 'true' : 'false'}
                    onChange={(e) => setValue('isMale', e.target.value === 'true')}
                    aria-invalid={!!errors.isMale}
                    borderRadius="xl"
                    borderWidth="2px"
                    borderColor="gray.200"
                    bg="white"
                    minH={{ base: '48px', md: '52px' }}
                    py={{ base: 3, md: 3.5 }}
                    fontSize={{ base: '16px', md: 'md' }}
                    _hover={{ borderColor: 'gray.300' }}
                    _focus={{
                      borderColor: 'blue.500',
                      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                    }}
                    _invalid={{ borderColor: 'red.500' }}
                  >
                    <option value="true">Male</option>
                    <option value="false">Female</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
                {errors.isMale && (
                  <Field.ErrorText>{errors.isMale.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* Marital Status */}
              <Field.Root invalid={!!errors.isMarried}>
                <Field.Label fontWeight="semibold" color="gray.600" mb={2.5}>
                  Marital Status (Optional)
                </Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={watch('isMarried') ? 'true' : 'false'}
                    onChange={(e) => setValue('isMarried', e.target.value === 'true')}
                    aria-invalid={!!errors.isMarried}
                    borderRadius="xl"
                    borderWidth="2px"
                    borderColor="gray.200"
                    bg="white"
                    minH={{ base: '48px', md: '52px' }}
                    py={{ base: 3, md: 3.5 }}
                    fontSize={{ base: '16px', md: 'md' }}
                    _hover={{ borderColor: 'gray.300' }}
                    _focus={{
                      borderColor: 'blue.500',
                      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                    }}
                    _invalid={{ borderColor: 'red.500' }}
                  >
                    <option value="false">Single</option>
                    <option value="true">Married</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
                {errors.isMarried && (
                  <Field.ErrorText>{errors.isMarried.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* Date of Birth */}
              <Field.Root invalid={!!errors.dob}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Date of Birth *
                </Field.Label>
                <Input
                  type="date"
                  {...register('dob')}
                  aria-invalid={!!errors.dob}
                  aria-describedby={errors.dob ? 'dob-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  py={{ base: 3, md: 3.5 }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.dob && (
                  <Field.ErrorText id="dob-error">{errors.dob.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* Deactivate At */}
              <Field.Root invalid={!!errors.deactivateAt}>
                <Field.Label fontWeight="semibold" color="gray.600" mb={2.5}>
                  Deactivate At (Optional)
                </Field.Label>
                <Input
                  type="date"
                  {...register('deactivateAt')}
                  aria-invalid={!!errors.deactivateAt}
                  aria-describedby={errors.deactivateAt ? 'deactivateAt-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  py={{ base: 3, md: 3.5 }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.deactivateAt && (
                  <Field.ErrorText id="deactivateAt-error">{errors.deactivateAt.message}</Field.ErrorText>
                )}
              </Field.Root>
            </SimpleGrid>
          </Box>

          {/* Section 2: Contact Information */}
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
              Contact Information
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: 3, md: 4 }}>
              {/* Phone */}
              <Field.Root invalid={!!errors.phone}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Phone *
                </Field.Label>
                <Input
                  type="tel"
                  {...register('phone')}
                  placeholder="0712345678"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  py={{ base: 3, md: 3.5 }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.phone && (
                  <Field.ErrorText id="phone-error">{errors.phone.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* Email */}
              <Field.Root invalid={!!errors.email}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Email *
                </Field.Label>
                <Input
                  type="email"
                  {...register('email')}
                  placeholder="john@example.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  py={{ base: 3, md: 3.5 }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.email && (
                  <Field.ErrorText id="email-error">{errors.email.message}</Field.ErrorText>
                )}
              </Field.Root>
            </SimpleGrid>
          </Box>

          {/* Section 3: Address */}
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
              Address
            </Heading>
            <SimpleGrid columns={{ base: 1 }} gap={{ base: 3, md: 4 }}>
              {/* Address Line 1 */}
              <Field.Root invalid={!!errors.addressLine1}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Address Line 1 *
                </Field.Label>
                <Input
                  {...register('addressLine1')}
                  placeholder="Street address"
                  aria-invalid={!!errors.addressLine1}
                  aria-describedby={errors.addressLine1 ? 'addressLine1-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  py={{ base: 3, md: 3.5 }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.addressLine1 && (
                  <Field.ErrorText id="addressLine1-error">{errors.addressLine1.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* Address Line 2 */}
              <Field.Root invalid={!!errors.addressLine2}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Address Line 2 *
                </Field.Label>
                <Input
                  {...register('addressLine2')}
                  placeholder="Apartment, suite, etc."
                  aria-invalid={!!errors.addressLine2}
                  aria-describedby={errors.addressLine2 ? 'addressLine2-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  py={{ base: 3, md: 3.5 }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.addressLine2 && (
                  <Field.ErrorText id="addressLine2-error">{errors.addressLine2.message}</Field.ErrorText>
                )}
              </Field.Root>
            </SimpleGrid>
          </Box>

          {/* Section 4: Package & Additional Information */}
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
              Package & Additional Information
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: 3, md: 4 }}>
              {/* Package */}
              <Field.Root invalid={!!errors.packageId} gridColumn={{ base: '1', md: '1 / -1' }}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Package *
                </Field.Label>
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={{ base: 2, md: 3 }} mt={2}>
                  {packages?.map((pkg: Package) => {
                    const pkgId = pkg._id || pkg.packageId;
                    const currentPackageId = watch('packageId');
                    // Check if this package matches the selected packageId (handles both _id and packageId formats)
                    const isSelected = currentPackageId === pkgId || 
                                      currentPackageId === pkg._id || 
                                      currentPackageId === pkg.packageId;
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

              {/* Profession */}
              <Field.Root invalid={!!errors.profession}>
                <Field.Label fontWeight="semibold" color="gray.600" mb={2.5}>
                  Profession (Optional)
                </Field.Label>
                <Input
                  {...register('profession')}
                  placeholder="Engineer, Teacher, etc."
                  aria-invalid={!!errors.profession}
                  aria-describedby={errors.profession ? 'profession-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  py={{ base: 3, md: 3.5 }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.profession && (
                  <Field.ErrorText id="profession-error">{errors.profession.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* Why Join */}
              <Field.Root invalid={!!errors.whyJoin}>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Why Join? *
                </Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    {...register('whyJoin')}
                    aria-invalid={!!errors.whyJoin}
                    aria-describedby={errors.whyJoin ? 'whyJoin-error' : undefined}
                    borderRadius="xl"
                    borderWidth="2px"
                    borderColor="gray.200"
                    bg="white"
                    minH={{ base: '48px', md: '52px' }}
                    py={{ base: 3, md: 3.5 }}
                    fontSize={{ base: '16px', md: 'md' }}
                    _hover={{ borderColor: 'gray.300' }}
                    _focus={{
                      borderColor: 'blue.500',
                      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                    }}
                    _invalid={{ borderColor: 'red.500' }}
                  >
                    <option value="">Select a reason</option>
                    <option value="Bulking">Bulking</option>
                    <option value="Strength">Strength</option>
                    <option value="Fatloss">Fatloss</option>
                    <option value="Regular Fitness">Regular Fitness</option>
                    <option value="Extreme Training">Extreme Training</option>
                    <option value="Athletic">Athletic</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
                {errors.whyJoin && (
                  <Field.ErrorText id="whyJoin-error">{errors.whyJoin.message}</Field.ErrorText>
                )}
              </Field.Root>

              {/* Reference */}
              <Field.Root invalid={!!errors.reference}>
                <Field.Label fontWeight="semibold" color="gray.600" mb={2.5}>
                  Reference (Optional)
                </Field.Label>
                <Input
                  {...register('reference')}
                  placeholder="How did you hear about us?"
                  aria-invalid={!!errors.reference}
                  aria-describedby={errors.reference ? 'reference-error' : undefined}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  py={{ base: 3, md: 3.5 }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                  _invalid={{ borderColor: 'red.500' }}
                />
                {errors.reference && (
                  <Field.ErrorText id="reference-error">{errors.reference.message}</Field.ErrorText>
                )}
              </Field.Root>
            </SimpleGrid>
          </Box>
        </VStack>
      </ModalForm>


      {/* FP Machine Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isFPConfirmDialogOpen}
        onClose={() => {
          setIsFPConfirmDialogOpen(false);
          setSelectedCustomerForFP(null);
        }}
        onConfirm={async () => {
          if (selectedCustomerForFP) {
            await updateFPStatusMutation.mutateAsync(selectedCustomerForFP);
            setIsFPConfirmDialogOpen(false);
            setSelectedCustomerForFP(null);
          }
        }}
        title="Remove from Fingerprint Machine"
        message="Are you sure you want to remove this customer from the fingerprint machine?"
        confirmLabel="OK"
        cancelLabel="Cancel"
        confirmColorScheme="red"
        isLoading={updateFPStatusMutation.isPending}
      />

      {/* PDF Generation Modal */}
      <ModalForm
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        onSubmit={handleGeneratePDF}
        title="Generate PDF Report"
        submitLabel="Generate PDF"
        cancelLabel="Cancel"
        size="lg"
      >
        <VStack gap={{ base: 3, md: 4 }} align="stretch">
          <Text fontSize="sm" color="gray.600">
            Select the fields you want to include in the PDF report. The report will include all {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} currently displayed.
          </Text>

          {/* Select All / Deselect All */}
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.700">
              Select Fields ({selectedPDFFields.length} of {AVAILABLE_PDF_FIELDS.length} selected)
            </Text>
            <HStack gap={{ base: 2, md: 2 }}>
              <ModernButton size="sm" variant="ghost" onClick={handleSelectAllPDFFields}>
                Select All
              </ModernButton>
              <ModernButton size="sm" variant="ghost" onClick={handleDeselectAllPDFFields}>
                Deselect All
              </ModernButton>
            </HStack>
          </HStack>

          {/* Field Selection */}
          <Box
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="md"
            p={4}
            maxH="400px"
            overflowY="auto"
          >
            <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
              {AVAILABLE_PDF_FIELDS.map((field) => {
                const isChecked = selectedPDFFields.includes(field.id);
                return (
                  <HStack key={field.id} gap={2} align="center">
                    <input
                      type="checkbox"
                      id={`pdf-field-${field.id}`}
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const newValues = [...selectedPDFFields, field.id];
                          handlePDFFieldsChange(newValues);
                        } else {
                          const newValues = selectedPDFFields.filter(id => id !== field.id);
                          handlePDFFieldsChange(newValues);
                        }
                      }}
                      style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                    />
                    <label
                      htmlFor={`pdf-field-${field.id}`}
                      style={{ fontSize: '14px', cursor: 'pointer', userSelect: 'none' }}
                    >
                      {field.label}
                    </label>
                  </HStack>
                );
              })}
            </SimpleGrid>
          </Box>

          {selectedPDFFields.length === 0 && (
            <Text fontSize="xs" color="red.500">
              Please select at least one field to generate the PDF.
            </Text>
          )}
        </VStack>
      </ModalForm>
    </Box>
  );
}
