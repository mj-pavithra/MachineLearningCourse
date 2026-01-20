import { useState, useCallback } from 'react';
import { Card, Box, VStack, HStack, Text, Skeleton } from '@chakra-ui/react';
import { ModernButton } from '@/components/ui/ModernButton';
import {
  HiLogin,
  HiCurrencyDollar,
  HiUserAdd,
  HiCalendar,
  HiCheckCircle,
} from 'react-icons/hi';
import { Icons } from '@/utils/icons';
import { ActivityItem } from '@/types/dashboard';
import { formatTimeAgo } from './utils/formatters';
import { useNavigate } from 'react-router-dom';

export interface RecentActivityCardProps {
  data: ActivityItem[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  maxItems?: number;
}

/**
 * Get icon for activity type
 */
function getActivityIcon(type: ActivityItem['type']) {
  const iconProps = { size: 20 };
  switch (type) {
    case 'login':
      return <HiLogin {...iconProps} />;
    case 'payment':
      return <HiCurrencyDollar {...iconProps} />;
    case 'customer_created':
      return <HiUserAdd {...iconProps} />;
    case 'session_created':
      return <HiCalendar {...iconProps} />;
    case 'attendance_marked':
      return <HiCheckCircle {...iconProps} />;
    case 'package_created':
      return <Icons.Package {...iconProps} />;
    default:
      return <HiCalendar {...iconProps} />;
  }
}

/**
 * Get color for activity type
 */
function getActivityColor(type: ActivityItem['type']): string {
  switch (type) {
    case 'login':
      return 'blue';
    case 'payment':
      return 'green';
    case 'customer_created':
      return 'purple';
    case 'session_created':
      return 'orange';
    case 'attendance_marked':
      return 'teal';
    case 'package_created':
      return 'pink';
    default:
      return 'gray';
  }
}

/**
 * Recent activity card with activity feed
 * 
 * @example
 * ```tsx
 * <RecentActivityCard
 *   data={activities}
 *   loading={isLoading}
 *   onLoadMore={() => loadMoreActivities()}
 *   hasMore={hasMore}
 * />
 * ```
 */
export function RecentActivityCard({
  data,
  loading = false,
  onLoadMore,
  hasMore = false,
  maxItems = 10,
}: RecentActivityCardProps) {
  const navigate = useNavigate();
  const [displayedItems, setDisplayedItems] = useState(maxItems);

  const handleLoadMore = useCallback(() => {
    if (onLoadMore) {
      onLoadMore();
    } else {
      setDisplayedItems((prev) => prev + maxItems);
    }
  }, [onLoadMore, maxItems]);

  const handleItemClick = (item: ActivityItem) => {
    if (item.link) {
      navigate(item.link);
    } else if (item.resourceId && item.resourceType) {
      // Generate link based on resource type
      const resourcePaths: Record<string, string> = {
        customer: '/customers',
        payment: '/finances/client-payments',
        session: '/sessions',
        package: '/packages',
      };
      const basePath = resourcePaths[item.resourceType] || '/';
      navigate(`${basePath}?id=${item.resourceId}`);
    }
  };

  const displayData = data.slice(0, displayedItems);
  const showLoadMore = hasMore || (data.length > displayedItems && !onLoadMore);

  if (loading && data.length === 0) {
    return (
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
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card.Root>
        <Card.Body>
          <VStack align="stretch" gap={4} textAlign="center" py={4}>
            <Text color="gray.500" fontSize="sm">
              No recent activity
            </Text>
          </VStack>
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <Card.Root>
      <Card.Body p={{ base: 3, md: 4, lg: 5 }}>
        <VStack align="stretch" gap={{ base: 3, md: 4 }}>
          {/* Header */}
          <Text fontSize="md" fontWeight="semibold" color="gray.900">
            Recent Activity
          </Text>

          {/* Activity list */}
          <VStack align="stretch" gap={3}>
            {displayData.map((item) => {
              const color = getActivityColor(item.type);
              const icon = getActivityIcon(item.type);
              const isClickable = item.link || (item.resourceId && item.resourceType);

              const content = (
                <HStack
                  gap={3}
                  p={2}
                  borderRadius="md"
                  _hover={isClickable ? { bg: 'gray.50', cursor: 'pointer' } : {}}
                  onClick={isClickable ? () => handleItemClick(item) : undefined}
                  role={isClickable ? 'button' : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  onKeyDown={
                    isClickable
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleItemClick(item);
                          }
                        }
                      : undefined
                  }
                >
                  {/* Icon */}
                  <Box
                    color={`${color}.500`}
                    bg={`${color}.50`}
                    p={2}
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {icon}
                  </Box>

                  {/* Content */}
                  <VStack flex={1} align="stretch" gap={0}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.900">
                      {item.title}
                    </Text>
                    {item.description && (
                      <Text 
                        fontSize="xs" 
                        color="gray.600"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                      >
                        {item.description}
                      </Text>
                    )}
                    <Text fontSize="xs" color="gray.500">
                      {formatTimeAgo(item.timestamp)}
                    </Text>
                  </VStack>
                </HStack>
              );

              return (
                <Box key={item.id} aria-label={`Activity: ${item.title} at ${formatTimeAgo(item.timestamp)}`}>
                  {isClickable ? content : <Box>{content}</Box>}
                </Box>
              );
            })}
          </VStack>

          {/* Load more button */}
          {showLoadMore && (
            <Box pt={2}>
              <ModernButton
                size="sm"
                variant="ghost"
                width="full"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : hasMore ? 'Load More' : 'See All'}
              </ModernButton>
            </Box>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}



