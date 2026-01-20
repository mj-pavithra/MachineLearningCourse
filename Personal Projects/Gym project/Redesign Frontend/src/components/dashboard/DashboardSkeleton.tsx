import { Box, Skeleton, SimpleGrid, Card, VStack, HStack } from '@chakra-ui/react';

/**
 * Skeleton loader for the entire dashboard
 * Shows placeholder loading states for all dashboard sections
 */
export function DashboardSkeleton() {
  return (
    <Box p={{ base: 4, md: 6 }}>
      {/* Header skeleton */}
      <HStack justify="space-between" mb={6}>
        <Skeleton height="32px" width="200px" />
        <HStack>
          <Skeleton height="40px" width="120px" />
          <Skeleton height="40px" width="120px" />
        </HStack>
      </HStack>

      {/* Filter bar skeleton */}
      <Box mb={6}>
        <HStack gap={4} flexWrap="wrap">
          <Skeleton height="40px" width="150px" />
          <Skeleton height="40px" width="150px" />
          <Skeleton height="40px" width="200px" />
          <Skeleton height="40px" width="100px" />
        </HStack>
      </Box>

      {/* KPI Grid skeleton */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6} mb={8}>
        {[1, 2, 3, 4].map((i) => (
          <Card.Root key={i}>
            <Card.Body>
              <VStack align="stretch" gap={2}>
                <Skeleton height="16px" width="60%" />
                <Skeleton height="40px" width="80%" />
                <Skeleton height="14px" width="40%" />
              </VStack>
            </Card.Body>
          </Card.Root>
        ))}
      </SimpleGrid>

      {/* Main content area skeleton */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6} mb={6}>
        {/* Left column - Chart and Table */}
        <Box gridColumn={{ base: '1', lg: 'span 2' }}>
          <VStack gap={6} align="stretch">
            {/* Chart card skeleton */}
            <Card.Root>
              <Card.Body>
                <VStack align="stretch" gap={4}>
                  <HStack justify="space-between">
                    <Skeleton height="24px" width="150px" />
                    <HStack>
                      <Skeleton height="32px" width="80px" />
                      <Skeleton height="32px" width="80px" />
                      <Skeleton height="32px" width="80px" />
                    </HStack>
                  </HStack>
                  <Skeleton height="300px" width="100%" />
                </VStack>
              </Card.Body>
            </Card.Root>

            {/* Table card skeleton */}
            <Card.Root>
              <Card.Body>
                <VStack align="stretch" gap={4}>
                  <Skeleton height="24px" width="150px" />
                  <VStack gap={2}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} height="48px" width="100%" />
                    ))}
                  </VStack>
                </VStack>
              </Card.Body>
            </Card.Root>
          </VStack>
        </Box>

        {/* Right column - Widgets */}
        <Box>
          <VStack gap={6} align="stretch">
            {/* Attendance card skeleton */}
            <Card.Root>
              <Card.Body>
                <VStack align="stretch" gap={4}>
                  <Skeleton height="20px" width="120px" />
                  <Skeleton height="120px" width="120px" borderRadius="full" mx="auto" />
                  <Skeleton height="36px" width="100%" />
                </VStack>
              </Card.Body>
            </Card.Root>

            {/* Activity card skeleton */}
            <Card.Root>
              <Card.Body>
                <VStack align="stretch" gap={4}>
                  <Skeleton height="20px" width="150px" />
                  <VStack gap={3} align="stretch">
                    {[1, 2, 3, 4].map((i) => (
                      <HStack key={i} gap={3}>
                        <Skeleton height="40px" width="40px" borderRadius="md" />
                        <VStack flex={1} align="stretch" gap={1}>
                          <Skeleton height="16px" width="80%" />
                          <Skeleton height="12px" width="60%" />
                        </VStack>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </Card.Body>
            </Card.Root>
          </VStack>
        </Box>
      </SimpleGrid>
    </Box>
  );
}



