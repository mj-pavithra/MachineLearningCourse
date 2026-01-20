import {
  Card,
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  IconButton,
  Menu,
  Skeleton,
} from '@chakra-ui/react';
import { HiPencil, HiDotsVertical } from 'react-icons/hi';
import { format } from 'date-fns';
import { Payment, PaymentStatus, DocumentStatus } from '@/types/finance';

export interface PaymentCardProps {
  payment: Payment;
  isLoading?: boolean;
  onEdit?: (payment: Payment) => void;
  actionMenuOpen?: string | null;
  onActionMenuChange?: (id: string | null) => void;
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount);
}

/**
 * Get status color
 */
function getStatusColor(status: DocumentStatus | PaymentStatus | string): 'green' | 'red' | 'gray' {
  if (status === PaymentStatus.PAID || status === 'PAID' || status === DocumentStatus.ACTIVE || status === 'ACTIVE') {
    return 'green';
  }
  if (status === PaymentStatus.NOT_PAID || status === 'NOT_PAID' || status === DocumentStatus.INACTIVE || status === 'INACTIVE') {
    return 'red';
  }
  return 'gray';
}

/**
 * Get border color based on status
 */
function getBorderColor(status: DocumentStatus | PaymentStatus | string): string {
  if (status === PaymentStatus.PAID || status === 'PAID' || status === DocumentStatus.ACTIVE || status === 'ACTIVE') {
    return 'green.500';
  }
  if (status === PaymentStatus.NOT_PAID || status === 'NOT_PAID' || status === DocumentStatus.INACTIVE || status === 'INACTIVE') {
    return 'red.500';
  }
  return 'gray.500';
}

/**
 * Get status label
 */
function getStatusLabel(status: DocumentStatus | PaymentStatus | string): string {
  if (status === PaymentStatus.PAID || status === 'PAID' || status === DocumentStatus.ACTIVE || status === 'ACTIVE') {
    return 'PAID';
  }
  if (status === PaymentStatus.NOT_PAID || status === 'NOT_PAID' || status === DocumentStatus.INACTIVE || status === 'INACTIVE') {
    return 'NOT PAID';
  }
  return String(status);
}

export function PaymentCard({
  payment,
  isLoading = false,
  onEdit,
  actionMenuOpen,
  onActionMenuChange,
}: PaymentCardProps) {
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

  const paymentId = payment.paymentId || payment.id || 'Unknown';
  const status = payment.status || PaymentStatus.NOT_PAID;
  const borderColor = getBorderColor(status);
  const statusColor = getStatusColor(status);
  const paymentKey = payment._id || payment.paymentId || payment.id || '';
  const amount = payment.amount || (payment.paidAmount ? parseFloat(payment.paidAmount) : 0);

  return (
    <Card.Root
      borderWidth="2px"
      borderColor={borderColor}
      _hover={{
        boxShadow: 'md',
        transform: 'translateY(-2px)',
        transition: 'all 0.2s',
      }}
      transition="all 0.2s"
    >
      <Card.Body p={{ base: 3, md: 4, lg: 5 }}>
        <VStack align="stretch" gap={{ base: 2, md: 3 }}>
          {/* Header with payment ID and actions */}
          <HStack justify="space-between" align="flex-start">
            <Box flex={1}>
              <Text fontSize="lg" fontWeight="semibold" color="gray.900" mb={1}>
                Payment #{paymentId}
              </Text>
              <HStack gap={2} mt={1} flexWrap="wrap">
                <Badge
                  colorPalette={statusColor}
                  variant="subtle"
                  fontSize="xs"
                >
                  {getStatusLabel(status)}
                </Badge>
                {payment.isExtra && (
                  <Badge
                    colorPalette="purple"
                    variant="subtle"
                    fontSize="xs"
                  >
                    Extra Payment
                  </Badge>
                )}
                {payment.accessgiven && (
                  <Badge
                    colorPalette="blue"
                    variant="subtle"
                    fontSize="xs"
                  >
                    Access Given
                  </Badge>
                )}
              </HStack>
            </Box>
            {onEdit && (
              <Menu.Root
                open={actionMenuOpen === paymentKey}
                onOpenChange={(e) => onActionMenuChange?.(e.open ? paymentKey : null)}
              >
                <Menu.Trigger asChild>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label={`Actions for payment ${paymentId}`}
                  >
                    <HiDotsVertical />
                  </IconButton>
                </Menu.Trigger>
                <Menu.Content>
                  <Menu.Item
                    onClick={() => onEdit(payment)}
                    value="edit"
                  >
                    <HiPencil />
                    Edit
                  </Menu.Item>
                </Menu.Content>
              </Menu.Root>
            )}
          </HStack>

          {/* Payment Details */}
          <VStack align="stretch" gap={2} mt={2}>
            {/* Amount */}
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Amount:
              </Text>
              <Text fontSize="lg" fontWeight="bold" color="blue.600">
                {formatCurrency(amount)}
              </Text>
            </HStack>

            {/* Month */}
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Month:
              </Text>
              <Text fontSize="sm" color="gray.900" fontWeight="normal">
                {payment.month || '-'}
              </Text>
            </HStack>

            {/* Reference */}
            {payment.reference && (
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  Reference:
                </Text>
                <Text 
                  fontSize="sm" 
                  color="gray.900" 
                  fontWeight="normal"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                >
                  {payment.reference}
                </Text>
              </HStack>
            )}

            {/* Client Name (if available) */}
            {payment.clientName && (
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  Client:
                </Text>
                <Text fontSize="sm" color="gray.900" fontWeight="normal">
                  {payment.clientName}
                </Text>
              </HStack>
            )}

            {/* Session Quota (for extra payments) */}
            {payment.sessionQuota && payment.sessionQuota > 0 && (
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  Sessions:
                </Text>
                <Badge
                  colorPalette="purple"
                  variant="subtle"
                  fontSize="xs"
                >
                  {payment.sessionQuota}
                </Badge>
              </HStack>
            )}

            {/* Payment Date */}
            {(payment.createdAt || payment.paymentDate) && (
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  Date:
                </Text>
                <Text fontSize="sm" color="gray.900" fontWeight="normal">
                  {format(new Date(payment.createdAt || payment.paymentDate || ''), 'MMM dd, yyyy')}
                </Text>
              </HStack>
            )}

            {/* Payment ID */}
            <HStack justify="space-between">
              <Text fontSize="xs" color="gray.500">
                Payment ID:
              </Text>
              <Text fontSize="xs" color="gray.500" fontFamily="mono">
                {paymentId}
              </Text>
            </HStack>
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

