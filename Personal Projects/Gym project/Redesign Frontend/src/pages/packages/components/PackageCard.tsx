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
import { Package } from '@/types/package';

export interface PackageCardProps {
  package: Package;
  isLoading?: boolean;
  onEdit?: (pkg: Package) => void;
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
 * Format duration
 */
function formatDuration(days: number): string {
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''}`;
  if (days < 365) {
    const months = Math.round(days / 30);
    return `${months} month${months !== 1 ? 's' : ''}`;
  }
  const years = Math.round(days / 365);
  return `${years} year${years !== 1 ? 's' : ''}`;
}

export function PackageCard({
  package: pkg,
  isLoading = false,
  onEdit,
  actionMenuOpen,
  onActionMenuChange,
}: PackageCardProps) {
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

  const packageName = pkg.package_name || pkg.name || 'Unnamed Package';
  const isActive = pkg.isActive ?? true;
  const borderColor = isActive ? 'green.500' : 'red.500';
  const packageId = pkg._id || pkg.packageId;

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
          {/* Header with name and actions */}
          <HStack justify="space-between" align="flex-start">
            <Box flex={1}>
              <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="semibold" color="gray.900" mb={1}>
                {packageName}
              </Text>
              <HStack gap={2} mt={1} flexWrap="wrap">
                <Badge
                  colorPalette={isActive ? 'green' : 'red'}
                  variant="subtle"
                  fontSize="xs"
                >
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
                {pkg.isGroup && (
                  <Badge
                    colorPalette="purple"
                    variant="subtle"
                    fontSize="xs"
                  >
                    Group
                  </Badge>
                )}
                {!pkg.isVisible && (
                  <Badge
                    colorPalette="gray"
                    variant="subtle"
                    fontSize="xs"
                  >
                    Hidden
                  </Badge>
                )}
              </HStack>
            </Box>
            {onEdit && (
              <Menu.Root
                open={actionMenuOpen === packageId}
                onOpenChange={(e) => onActionMenuChange?.(e.open ? packageId : null)}
              >
                <Menu.Trigger asChild>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label={`Actions for ${packageName}`}
                  >
                    <HiDotsVertical />
                  </IconButton>
                </Menu.Trigger>
                <Menu.Content>
                  <Menu.Item
                    onClick={() => onEdit(pkg)}
                    value="edit"
                  >
                    <HiPencil />
                    Edit
                  </Menu.Item>
                </Menu.Content>
              </Menu.Root>
            )}
          </HStack>

          {/* Package Details */}
          <VStack align="stretch" gap={2} mt={2}>
            {/* Description */}
            {pkg.description && (
              <Text
                fontSize="sm"
                color="gray.600"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {pkg.description}
              </Text>
            )}

            {/* Price */}
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Price:
              </Text>
              <Text fontSize="lg" fontWeight="bold" color="blue.600">
                {formatCurrency(pkg.price)}
              </Text>
            </HStack>

            {/* Duration */}
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Duration:
              </Text>
              <Text fontSize="sm" color="gray.900" fontWeight="normal">
                {formatDuration(pkg.durationDays)}
              </Text>
            </HStack>

            {/* Sessions */}
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Sessions:
              </Text>
              <Badge
                colorPalette={pkg.sessions >= 999999 ? 'purple' : 'blue'}
                variant="subtle"
                fontSize="xs"
              >
                {pkg.sessions >= 999999 ? 'Unlimited' : pkg.sessions.toString()}
              </Badge>
            </HStack>

            {/* Package ID */}
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Package ID:
              </Text>
              <Text fontSize="sm" color="gray.900" fontWeight="normal" fontFamily="mono">
                {pkg.packageId || '-'}
              </Text>
            </HStack>

            {/* Created Date */}
            {pkg.createdAt && (
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  Created:
                </Text>
                <Text fontSize="sm" color="gray.900" fontWeight="normal">
                  {format(new Date(pkg.createdAt), 'MMM dd, yyyy')}
                </Text>
              </HStack>
            )}
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

