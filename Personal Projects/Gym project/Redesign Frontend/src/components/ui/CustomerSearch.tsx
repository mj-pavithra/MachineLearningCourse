import { useState, useEffect, useRef, useMemo } from 'react';
import { Box, Input, IconButton, Text } from '@chakra-ui/react';
import { HiX } from 'react-icons/hi';

export interface CustomerSearchProps {
  value: string; // Selected customer ID
  onSelect: (customerId: string, customer: any) => void;
  customers: any[]; // List of customers
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  label?: string;
  invalid?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

export function CustomerSearch({
  value,
  onSelect,
  customers,
  placeholder = 'Search client by name, email, phone, or client ID...',
  error,
  disabled = false,
  label,
  invalid = false,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: CustomerSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [committedSearchTerm, setCommittedSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get selected customer for display
  const selectedCustomer = useMemo(() => {
    if (!value) return null;
    return customers.find((c: any) => c.clientId === value);
  }, [customers, value]);

  // Filter customers based on committed search term
  const filteredCustomers = useMemo(() => {
    if (!committedSearchTerm || committedSearchTerm.length < 2) {
      return customers.slice(0, 10); // Show first 10 when no search
    }

    const searchLower = committedSearchTerm.toLowerCase();
    return customers.filter((customer: any) => {
      const customerId = customer.clientId || '';
      const customerName = ('firstName' in customer && customer.firstName)
        ? `${customer.firstName} ${customer.lastName || ''}`.trim().toLowerCase()
        : ('name' in customer ? customer.name || '' : '').toLowerCase();
      const email = (customer.email || '').toLowerCase();
      const phone = (customer.phone || '').toLowerCase();
      const clientId = (customer.clientId || '').toLowerCase();

      return (
        customerName.includes(searchLower) ||
        email.includes(searchLower) ||
        phone.includes(searchLower) ||
        clientId.includes(searchLower) ||
        customerId.toLowerCase().includes(searchLower)
      );
    }).slice(0, 10); // Limit to 10 results
  }, [customers, committedSearchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

  // Update search term when value changes externally
  useEffect(() => {
    if (!value && searchTerm) {
      setSearchTerm('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    if (!newValue && value) {
      onSelect('', null);
      setCommittedSearchTerm('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setCommittedSearchTerm(searchTerm);
      setIsDropdownOpen(true);
    }
  };

  const handleInputFocus = () => {
    // Only open dropdown if there's a committed search term
    if (committedSearchTerm && committedSearchTerm.length >= 2) {
      setIsDropdownOpen(true);
    }
  };

  const handleSelect = (customer: any) => {
    const customerId = customer.clientId || '';
    onSelect(customerId, customer);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const handleClear = () => {
    onSelect('', null);
    setSearchTerm('');
    setCommittedSearchTerm('');
    setIsDropdownOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const displayValue = selectedCustomer
    ? (('firstName' in selectedCustomer && selectedCustomer.firstName)
        ? `${selectedCustomer.firstName} ${selectedCustomer.lastName || ''}`.trim()
        : ('name' in selectedCustomer ? selectedCustomer.name : '') || '')
    : searchTerm;

  return (
    <Box position="relative" width="100%">
      {label && (
        <Text fontSize="sm" fontWeight="medium" mb={2}>
          {label}
        </Text>
      )}
      <Input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={ariaInvalid || invalid || !!error}
        aria-describedby={ariaDescribedBy || (error ? 'customer-search-error' : undefined)}
      />
      {selectedCustomer && !disabled && (
        <IconButton
          size="sm"
          variant="ghost"
          position="absolute"
          right="4px"
          top="50%"
          transform="translateY(-50%)"
          onClick={handleClear}
          aria-label="Clear selection"
        >
          <HiX />
        </IconButton>
      )}
      {isDropdownOpen && (
        <Box
          ref={dropdownRef}
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
          bg="white"
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="lg"
          zIndex={1000}
          maxH="300px"
          overflowY="auto"
        >
          {filteredCustomers.length === 0 ? (
            <Box p={3}>
              <Text fontSize="sm" color="gray.500">
                No clients found
              </Text>
            </Box>
          ) : (
            filteredCustomers.map((customer: any) => {
              const customerId = customer.clientId || '';
              const customerName = ('firstName' in customer && customer.firstName)
                ? `${customer.firstName} ${customer.lastName || ''}`.trim()
                : ('name' in customer ? customer.name : '') || customerId;
              const isSelected = value === customerId;
              return (
                <Box
                  key={customerId}
                  p={3}
                  cursor="pointer"
                  bg={isSelected ? 'blue.50' : 'transparent'}
                  _hover={{ bg: isSelected ? 'blue.50' : 'gray.100' }}
                  borderLeftWidth={isSelected ? '3px' : '0'}
                  borderLeftColor={isSelected ? 'blue.500' : 'transparent'}
                  onClick={() => handleSelect(customer)}
                >
                  <Text fontSize="sm" fontWeight={isSelected ? 'semibold' : 'medium'}>
                    {customerName}
                  </Text>
                  {customer.clientId && (
                    <Text fontSize="xs" color="gray.600">
                      Client ID: {customer.clientId}
                    </Text>
                  )}
                  {customer.email && (
                    <Text fontSize="xs" color="gray.500">
                      {customer.email}
                    </Text>
                  )}
                </Box>
              );
            })
          )}
        </Box>
      )}
      {error && (
        <Text fontSize="xs" color="red.500" mt={1} id="customer-search-error">
          {error}
        </Text>
      )}
    </Box>
  );
}

