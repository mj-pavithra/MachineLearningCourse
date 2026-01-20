import { Box, Spinner, VStack, Skeleton, SkeletonText } from '@chakra-ui/react';

/**
 * Loading skeleton shown during route transitions and lazy loading
 */
export default function RouteSkeleton() {
  return (
    <Box p={6}>
      <VStack gap={4} align="stretch">
        {/* Header skeleton */}
        <Skeleton height="40px" width="200px" />
        
        {/* Content skeleton */}
        <SkeletonText mt="4" noOfLines={3} gap="4" />
        
        {/* Card skeletons */}
        <VStack gap={4} align="stretch" mt={4}>
          <Skeleton height="100px" borderRadius="md" />
          <Skeleton height="100px" borderRadius="md" />
          <Skeleton height="100px" borderRadius="md" />
        </VStack>
        
        {/* Spinner as fallback */}
        <Box display="flex" justifyContent="center" mt={8}>
          <Spinner size="xl" />
        </Box>
      </VStack>
    </Box>
  );
}

