import { Card, Box, VStack, HStack, Text, Skeleton, Badge } from '@chakra-ui/react';
import { HiUsers } from 'react-icons/hi';
import { ClientChart } from '@/components/charts/ClientChart';
import { formatNumber } from './utils/formatters';

export interface ClientStatsCardProps {
  individual: number;
  group: number;
  pendingPayments: number;
  loading?: boolean;
  onClick?: () => void;
}

/**
 * Client statistics card with bar chart
 * Displays total clients, individual, group, and pending payments
 * 
 * @example
 * ```tsx
 * <ClientStatsCard
 *   individual={100}
 *   group={20}
 *   pendingPayments={15}
 *   onClick={() => navigate('/customers')}
 * />
 * ```
 */
export function ClientStatsCard({ individual, group, pendingPayments, loading = false, onClick }: ClientStatsCardProps) {
  const total = individual + group;

  if (loading) {
    return (
      <Card.Root>
        <Card.Body p={{ base: 3, md: 4, lg: 5 }}>
          <VStack align="stretch" gap={{ base: 3, md: 4 }}>
            <Skeleton height="24px" width="60%" />
            <Skeleton height="32px" width="40%" />
            <Skeleton height="250px" width="100%" />
          </VStack>
        </Card.Body>
      </Card.Root>
    );
  }

  const cardContent = (
    <Card.Root
      cursor={onClick ? 'pointer' : 'default'}
      onClick={onClick}
      transition="all 0.2s"
      _hover={onClick ? { transform: 'translateY(-2px)', shadow: 'lg' } : {}}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      aria-label={onClick ? 'View customers' : undefined}
      height="100%"
    >
      <Card.Body p={{ base: 3, md: 4, lg: 5 }}>
        <VStack align="stretch" gap={{ base: 3, md: 4 }}>
          {/* Header */}
          <HStack justify="space-between" align="center" flexWrap="wrap">
            <HStack gap={2}>
              <Box color="blue.500" fontSize="xl">
                <HiUsers />
              </Box>
              <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="semibold" color="gray.900">
                Clients
              </Text>
            </HStack>
            {onClick && (
              <Badge colorPalette="blue" variant="subtle" fontSize="xs">
                View All
              </Badge>
            )}
          </HStack>

          {/* Total Count */}
          <VStack align="flex-start" gap={1}>
            <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color="gray.900">
              {formatNumber(total)}
            </Text>
            <Text fontSize="sm" color="gray.600">
              Total Clients
            </Text>
          </VStack>

          {/* Breakdown */}
          <HStack justify="space-between" gap={4} flexWrap="wrap">
            <VStack align="flex-start" gap={1} flex={1} minW="100px">
              <HStack gap={1}>
                <Box width="12px" height="12px" borderRadius="full" bg="blue.500" />
                <Text fontSize="sm" color="gray.600">
                  Individual
                </Text>
              </HStack>
              <Text fontSize="lg" fontWeight="semibold" color="gray.900">
                {formatNumber(individual)}
              </Text>
            </VStack>
            <VStack align="flex-start" gap={1} flex={1} minW="100px">
              <HStack gap={1}>
                <Box width="12px" height="12px" borderRadius="full" bg="green.500" />
                <Text fontSize="sm" color="gray.600">
                  Group
                </Text>
              </HStack>
              <Text fontSize="lg" fontWeight="semibold" color="gray.900">
                {formatNumber(group)}
              </Text>
            </VStack>
            <VStack align="flex-start" gap={1} flex={1} minW="100px">
              <HStack gap={1}>
                <Box width="12px" height="12px" borderRadius="full" bg="yellow.500" />
                <Text fontSize="sm" color="gray.600">
                  Pending
                </Text>
              </HStack>
              <Text fontSize="lg" fontWeight="semibold" color="gray.900">
                {formatNumber(pendingPayments)}
              </Text>
            </VStack>
          </HStack>

          {/* Chart */}
          <Box mt={2}>
            <ClientChart
              individual={individual}
              group={group}
              pendingPayments={pendingPayments}
              isLoading={loading}
              height={250}
            />
          </Box>
        </VStack>
      </Card.Body>
    </Card.Root>
  );

  return cardContent;
}

