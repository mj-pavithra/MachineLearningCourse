import { useMemo } from 'react';
import { Card, Box, VStack, HStack, Text, IconButton, Menu } from '@chakra-ui/react';
import { ModernButton } from '@/components/ui/ModernButton';
import { HiEye, HiDotsVertical, HiRefresh } from 'react-icons/hi';
import { RecentPayment } from '@/types/dashboard';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { formatCurrency, formatDate } from './utils/formatters';
import { useNavigate } from 'react-router-dom';

export interface PaymentsTableCardProps {
  data: RecentPayment[];
  loading?: boolean;
  total?: number;
  page?: number;
  size?: number;
  onPageChange?: (page: number) => void;
  onSizeChange?: (size: number) => void;
  onRefresh?: () => void;
  onViewPayment?: (payment: RecentPayment) => void;
  onRefundPayment?: (payment: RecentPayment) => void;
}

/**
 * Payments table card displaying recent payments with actions
 * 
 * @example
 * ```tsx
 * <PaymentsTableCard
 *   data={payments}
 *   loading={isLoading}
 *   total={100}
 *   page={1}
 *   size={10}
 *   onPageChange={(page) => setPage(page)}
 *   onViewPayment={(payment) => navigate(`/finances/payments/${payment.id}`)}
 * />
 * ```
 */
export function PaymentsTableCard({
  data,
  loading = false,
  total = 0,
  page = 1,
  size = 10,
  onRefresh,
  onViewPayment,
  onRefundPayment,
}: PaymentsTableCardProps) {
  const navigate = useNavigate();

  const columns: DataTableColumn<RecentPayment>[] = useMemo(
    () => [
      {
        key: 'date',
        header: 'Date',
        width: '120px',
        accessor: (row: RecentPayment) => {
          if (!row.date) {
            return '-';
          }
          return formatDate(row.date, 'MMM dd, yyyy');
        },
      },
      {
        key: 'customerName',
        header: 'Customer',
        width: '150px',
        accessor: (row: RecentPayment) => row.customerName,
      },
      {
        key: 'packageName',
        header: 'Package',
        width: '150px',
        accessor: (row: RecentPayment) => row.packageName,
      },
      {
        key: 'amount',
        header: 'Amount',
        width: '120px',
        render: (row: RecentPayment) => (
          <Text fontWeight="semibold" color="gray.900">
            {formatCurrency(row.amount)}
          </Text>
        ),
      },
      {
        key: 'method',
        header: 'Method',
        width: '100px',
        render: (row: RecentPayment) => (
          <Text
            fontSize="sm"
            color={
              row.method === 'CASH'
                ? 'green.600'
                : row.method === 'ONLINE'
                ? 'blue.600'
                : 'gray.600'
            }
          >
            {row.method.replace('_', ' ')}
          </Text>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: '100px',
        render: (row: RecentPayment) => {
          const statusColors: Record<RecentPayment['status'], string> = {
            PAID: 'green',
            PENDING: 'yellow',
            REFUNDED: 'red',
            FAILED: 'red',
          };
          const color = statusColors[row.status] || 'gray';
          return (
            <Text
              fontSize="sm"
              fontWeight="medium"
              color={`${color}.600`}
              textTransform="capitalize"
            >
              {row.status.toLowerCase()}
            </Text>
          );
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        width: '80px',
        render: (row: RecentPayment) => (
          <Menu.Root>
            <Menu.Trigger asChild>
              <IconButton
                variant="ghost"
                size="sm"
                aria-label={`Actions for payment ${row.id}`}
              >
                <HiDotsVertical />
              </IconButton>
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item
                onClick={() => onViewPayment?.(row)}
                value="view"
              >
                <HiEye />
                View
              </Menu.Item>
              {row.status === 'PAID' && onRefundPayment && (
                <Menu.Item
                  onClick={() => onRefundPayment(row)}
                  value="refund"
                  colorPalette="red"
                >
                  Refund
                </Menu.Item>
              )}
            </Menu.Content>
          </Menu.Root>
        ),
      },
    ],
    [onViewPayment, onRefundPayment]
  );

  const handleRowClick = (payment: RecentPayment) => {
    if (onViewPayment) {
      onViewPayment(payment);
    } else if (payment.id) {
      navigate(`/finances/client-payments?paymentId=${payment.id}`);
    }
  };

  return (
    <Card.Root>
      <Card.Body p={{ base: 3, md: 4, lg: 5 }}>
        <VStack align="stretch" gap={{ base: 3, md: 4 }}>
          {/* Header */}
          <HStack justify="space-between" align="center">
            <Text fontSize="lg" fontWeight="semibold" color="gray.900">
              Recent Payments
            </Text>
            {onRefresh && (
              <ModernButton
                size="sm"
                variant="ghost"
                onClick={onRefresh}
                disabled={loading}
              >
                <HiRefresh />
                Refresh
              </ModernButton>
            )}
          </HStack>

          {/* Table */}
          <Box>
            <DataTable
              data={data}
              columns={columns}
              isLoading={loading}
              emptyMessage="No payments found"
              onRowClick={handleRowClick}
              ariaLabel="Recent payments table"
            />
          </Box>

          {/* Pagination info */}
          {!loading && total > 0 && (
            <Text fontSize="sm" color="gray.600" textAlign="right">
              Showing {((page - 1) * size) + 1} - {Math.min(page * size, total)} of {total} payments
            </Text>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

