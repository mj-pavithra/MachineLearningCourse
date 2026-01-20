import {
  Card,
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Menu,
  Skeleton,
} from '@chakra-ui/react';
import { HiPencil, HiDotsVertical } from 'react-icons/hi';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Customer, IndividualCustomer } from '@/types/customer';
import { getWhatsAppUrl } from '@/utils/whatsapp';
import { ModernButton } from '@/components/ui/ModernButton';

export interface CustomerCardProps {
  customer: Customer | IndividualCustomer;
  isLoading?: boolean;
  onEdit?: (customer: Customer | IndividualCustomer) => void;
  actionMenuOpen?: string | null;
  onActionMenuChange?: (id: string | null) => void;
  onClick?: (customer: Customer | IndividualCustomer) => void;
  onOpenFPConfirm?: (customer: Customer | IndividualCustomer) => void;
}

/**
 * Extract customer name parts (firstName + lastName)
 */
function getCustomerName(customer: Customer | IndividualCustomer): { firstName: string; lastName: string } {
  if ('firstName' in customer && customer.firstName) {
    return {
      firstName: customer.firstName,
      lastName: customer.lastName || '',
    };
  }
  // Fallback: split name field (only for Customer type, not IndividualCustomer)
  if ('name' in customer && customer.name) {
    const nameParts = customer.name.split(' ') || ['', ''];
    return {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
    };
  }
  return {
    firstName: '',
    lastName: '',
  };
}

/**
 * Extract clientId from customer
 */
function getClientId(customer: Customer | IndividualCustomer): string {
  if ('clientId' in customer && customer.clientId) {
    return customer.clientId;
  }
  return '-';
}

/**
 * Extract reference from customer
 */
function getReference(customer: Customer | IndividualCustomer): string {
  if ('reference' in customer && customer.reference) {
    return customer.reference;
  }
  return '-';
}

/**
 * Extract deactivateAt from customer
 */
function getDeactivateAt(customer: Customer | IndividualCustomer): string | null {
  if ('deactivateAt' in customer && customer.deactivateAt) {
    return customer.deactivateAt;
  }
  return null;
}

/**
 * Check if isOnFPmachine is false (handles both boolean and string values)
 */
function isOnFPmachineFalse(customer: Customer | IndividualCustomer): boolean {
  const value = 'isOnFPmachine' in customer ? customer.isOnFPmachine : undefined;
  if (value === undefined) return false;
  // Handle both string "false" and boolean false
  return value === false || value === 'false';
}

export function CustomerCard({
  customer,
  isLoading = false,
  onEdit,
  actionMenuOpen,
  onActionMenuChange,
  onClick,
  onOpenFPConfirm,
}: CustomerCardProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card.Root>
        <Card.Body>
          <VStack align="stretch" gap={3}>
            <Skeleton height="24px" width="60%" />
            <Skeleton height="16px" width="80%" />
            <Skeleton height="16px" width="70%" />
            <Skeleton height="16px" width="50%" />
          </VStack>
        </Card.Body>
      </Card.Root>
    );
  }

  const { firstName, lastName } = getCustomerName(customer);
  const clientId = getClientId(customer);
  const reference = getReference(customer);
  const deactivateAt = getDeactivateAt(customer);
  const isActive = customer.isActive ?? true;
  const borderColor = isActive ? 'green.500' : 'red.500';
  const shouldShowRedBackground = isOnFPmachineFalse(customer);

  const customerId = clientId;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the action menu or buttons
    if ((e.target as HTMLElement).closest('[role="menu"]') || (e.target as HTMLElement).closest('button')) {
      return;
    }
    
    if (onClick) {
      onClick(customer);
    } else if (clientId && clientId !== '-') {
      navigate(`/customers/profile/${clientId}`);
    }
  };

  const handleActiveButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenFPConfirm) {
      onOpenFPConfirm(customer);
    }
  };

  return (
    <Card.Root
      borderWidth="2px"
      borderColor={borderColor}
      bg={shouldShowRedBackground ? 'red.80' : undefined}
      cursor={clientId && clientId !== '-' ? 'pointer' : 'default'}
      onClick={handleCardClick}
      _hover={{
        boxShadow: 'md',
        transform: 'translateY(-2px)',
        transition: 'all 0.2s',
      }}
      transition="all 0.2s"
    >
      <Card.Body p={{ base: 4, md: 4, lg: 5 }}>
        <VStack align="stretch" gap={{ base: 3, md: 3 }}>
          {/* Header with name and actions */}
          <HStack justify="space-between" align="flex-start">
            <Box flex={1}>
              <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="semibold" color="gray.900" mb={1}>
                {firstName} {lastName}
              </Text>
              <ModernButton
                size="xs"
                colorPalette={isActive ? 'green' : 'red'}
                variant="subtle"
                onClick={handleActiveButtonClick}
              >
                {isActive ? 'Active' : 'Inactive'}
              </ModernButton>
            </Box>
            {onEdit && (
              <Menu.Root
                open={actionMenuOpen === customerId}
                onOpenChange={(e) => onActionMenuChange?.(e.open ? customerId : null)}
              >
                <Menu.Trigger asChild>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    h={{ base: '36px', md: 'auto' }}
                    w={{ base: '36px', md: 'auto' }}
                    minW={{ base: '36px', md: 'auto' }}
                    fontSize={{ base: 'lg', md: 'md' }}
                    aria-label={`Actions for ${firstName} ${lastName}`}
                  >
                    <HiDotsVertical />
                  </IconButton>
                </Menu.Trigger>
                <Menu.Content>
                  <Menu.Item
                    onClick={() => onEdit(customer)}
                    value="edit"
                  >
                    <HiPencil />
                    Edit
                  </Menu.Item>
                </Menu.Content>
              </Menu.Root>
            )}
          </HStack>

          {/* Customer Details */}
          <VStack align="stretch" gap={2} mt={2}>
            {/* Mobile Number */}
            <HStack justify="space-between">
              <Text fontSize={{ base: 'sm', md: 'sm' }} color="gray.600" fontWeight="medium">
                Mobile:
              </Text>
              {customer.mobileNumber && getWhatsAppUrl(customer.mobileNumber) ? (
                <a
                  href={getWhatsAppUrl(customer.mobileNumber) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  style={{
                    fontSize: '0.875rem',
                    color: '#3182ce',
                    fontWeight: 'normal',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#2c5282';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#3182ce';
                  }}
                >
                  {customer.mobileNumber}
                </a>
              ) : (
                <Text fontSize="sm" color="gray.900" fontWeight="normal">
                  {customer.mobileNumber || '-'}
                </Text>
              )}
            </HStack>

            {/* Client ID */}
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Client ID:
              </Text>
              <Text fontSize="sm" color="gray.900" fontWeight="normal" fontFamily="mono">
                {clientId}
              </Text>
            </HStack>

            {/* Reference */}
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Reference:
              </Text>
              <Text fontSize="sm" color="gray.900" fontWeight="normal">
                {reference}
              </Text>
            </HStack>

            {/* Deactivate At */}
            {deactivateAt && (
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  Deactivate At:
                </Text>
                <Text fontSize="sm" color="gray.900" fontWeight="normal">
                  {format(new Date(deactivateAt), 'MMM dd, yyyy')}
                </Text>
              </HStack>
            )}
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}


