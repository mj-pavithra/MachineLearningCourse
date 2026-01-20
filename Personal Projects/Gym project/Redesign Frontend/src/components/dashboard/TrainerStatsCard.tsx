import { Card, Box, VStack, HStack, Text, Skeleton, Badge } from '@chakra-ui/react';
import { HiUserGroup } from 'react-icons/hi';
import { TrainerChart } from '@/components/charts/TrainerChart';
import { formatNumber } from './utils/formatters';

export interface TrainerStatsCardProps {
  partTime: number;
  fullTime: number;
  loading?: boolean;
  onClick?: () => void;
}

/**
 * Trainer statistics card with pie chart
 * Displays total trainers, part-time, and full-time breakdown
 * 
 * @example
 * ```tsx
 * <TrainerStatsCard
 *   partTime={5}
 *   fullTime={10}
 *   onClick={() => navigate('/trainers')}
 * />
 * ```
 */
export function TrainerStatsCard({ partTime, fullTime, loading = false, onClick }: TrainerStatsCardProps) {
  const total = partTime + fullTime;

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
      aria-label={onClick ? 'View trainers' : undefined}
      height="100%"
    >
      <Card.Body p={{ base: 3, md: 4, lg: 5 }}>
        <VStack align="stretch" gap={{ base: 3, md: 4 }}>
          {/* Header */}
          <HStack justify="space-between" align="center" flexWrap="wrap">
            <HStack gap={2}>
              <Box color="blue.500" fontSize="xl">
                <HiUserGroup />
              </Box>
              <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="semibold" color="gray.900">
                Trainers
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
              Total Trainers
            </Text>
          </VStack>

          {/* Breakdown */}
          <HStack justify="space-between" gap={4} flexWrap="wrap">
            <VStack align="flex-start" gap={1} flex={1} minW="100px">
              <HStack gap={1}>
                <Box width="12px" height="12px" borderRadius="full" bg="blue.500" />
                <Text fontSize="sm" color="gray.600">
                  Part-time
                </Text>
              </HStack>
              <Text fontSize="lg" fontWeight="semibold" color="gray.900">
                {formatNumber(partTime)}
              </Text>
            </VStack>
            <VStack align="flex-start" gap={1} flex={1} minW="100px">
              <HStack gap={1}>
                <Box width="12px" height="12px" borderRadius="full" bg="green.500" />
                <Text fontSize="sm" color="gray.600">
                  Full-time
                </Text>
              </HStack>
              <Text fontSize="lg" fontWeight="semibold" color="gray.900">
                {formatNumber(fullTime)}
              </Text>
            </VStack>
          </HStack>

          {/* Chart */}
          <Box mt={2}>
            <TrainerChart
              partTime={partTime}
              fullTime={fullTime}
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

