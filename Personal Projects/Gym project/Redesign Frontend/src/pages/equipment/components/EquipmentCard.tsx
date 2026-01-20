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
import { Equipment, EquipmentStatus, EquipmentType, MuscleGroup } from '@/types/equipment';

export interface EquipmentCardProps {
  equipment: Equipment;
  isLoading?: boolean;
  onEdit?: (equipment: Equipment) => void;
  actionMenuOpen?: string | null;
  onActionMenuChange?: (id: string | null) => void;
}

/**
 * Format equipment type for display
 */
function formatEquipmentType(type: EquipmentType | string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format muscle group for display
 */
function formatMuscleGroup(group: MuscleGroup | string): string {
  return group
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get status color
 */
function getStatusColor(status: EquipmentStatus | string): 'green' | 'yellow' | 'red' {
  switch (status) {
    case EquipmentStatus.AVAILABLE:
    case 'available':
      return 'green';
    case EquipmentStatus.MAINTENANCE:
    case 'maintenance':
      return 'yellow';
    case EquipmentStatus.RETIRED:
    case 'retired':
      return 'red';
    default:
      return 'yellow'; // Default to yellow for unknown statuses
  }
}

/**
 * Get border color based on status
 */
function getBorderColor(status: EquipmentStatus | string): string {
  switch (status) {
    case EquipmentStatus.AVAILABLE:
    case 'available':
      return 'green.500';
    case EquipmentStatus.MAINTENANCE:
    case 'maintenance':
      return 'yellow.500';
    case EquipmentStatus.RETIRED:
    case 'retired':
      return 'red.500';
    default:
      return 'gray.500';
  }
}

export function EquipmentCard({
  equipment,
  isLoading = false,
  onEdit,
  actionMenuOpen,
  onActionMenuChange,
}: EquipmentCardProps) {
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

  const equipmentName = equipment.name || 'Unnamed Equipment';
  const status = equipment.status || equipment.equipmentStatus || EquipmentStatus.AVAILABLE;
  const borderColor = getBorderColor(status);
  const statusColor = getStatusColor(status);
  const equipmentId = equipment._id || equipment.equipmentId;

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
              <Text fontSize="lg" fontWeight="semibold" color="gray.900" mb={1}>
                {equipmentName}
              </Text>
              <HStack gap={2} mt={1} flexWrap="wrap">
                <Badge
                  colorPalette={statusColor}
                  variant="subtle"
                  fontSize="xs"
                >
                  {status === EquipmentStatus.AVAILABLE
                    ? 'Available'
                    : status === EquipmentStatus.MAINTENANCE
                    ? 'Maintenance'
                    : 'Retired'}
                </Badge>
                <Badge
                  colorPalette="blue"
                  variant="subtle"
                  fontSize="xs"
                >
                  {formatEquipmentType(equipment.type || equipment.equipmentType || 'unknown')}
                </Badge>
              </HStack>
            </Box>
            {onEdit && (
              <Menu.Root
                open={actionMenuOpen === equipmentId}
                onOpenChange={(e) => onActionMenuChange?.(e.open ? equipmentId : null)}
              >
                <Menu.Trigger asChild>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label={`Actions for ${equipmentName}`}
                  >
                    <HiDotsVertical />
                  </IconButton>
                </Menu.Trigger>
                <Menu.Content>
                  <Menu.Item
                    onClick={() => onEdit(equipment)}
                    value="edit"
                  >
                    <HiPencil />
                    Edit
                  </Menu.Item>
                </Menu.Content>
              </Menu.Root>
            )}
          </HStack>

          {/* Equipment Details */}
          <VStack align="stretch" gap={2} mt={2}>
            {/* Brand and Model */}
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Brand:
              </Text>
              <Text fontSize="sm" color="gray.900" fontWeight="normal">
                {equipment.brand || '-'}
              </Text>
            </HStack>

            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Model:
              </Text>
              <Text fontSize="sm" color="gray.900" fontWeight="normal">
                {equipment.model || '-'}
              </Text>
            </HStack>

            {/* Location */}
            {(equipment.location?.room || equipment.location?.zone) && (
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  Location:
                </Text>
                <Text fontSize="sm" color="gray.900" fontWeight="normal">
                  {[equipment.location.room, equipment.location.zone].filter(Boolean).join(', ') || '-'}
                </Text>
              </HStack>
            )}

            {/* Quantity */}
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Quantity:
              </Text>
              <Text fontSize="sm" color="gray.900" fontWeight="normal">
                {equipment.quantityAvailable} / {equipment.quantityTotal} available
              </Text>
            </HStack>

            {/* Muscle Groups */}
            {equipment.muscleGroups && equipment.muscleGroups.length > 0 && (
              <Box>
                <Text fontSize="sm" color="gray.600" fontWeight="medium" mb={1}>
                  Muscle Groups:
                </Text>
                <HStack gap={1} flexWrap="wrap">
                  {equipment.muscleGroups.slice(0, 3).map((group, idx) => (
                    <Badge
                      key={idx}
                      colorPalette="purple"
                      variant="subtle"
                      fontSize="xs"
                    >
                      {formatMuscleGroup(group)}
                    </Badge>
                  ))}
                  {equipment.muscleGroups.length > 3 && (
                    <Badge colorPalette="gray" variant="subtle" fontSize="xs">
                      +{equipment.muscleGroups.length - 3} more
                    </Badge>
                  )}
                </HStack>
              </Box>
            )}

            {/* Equipment ID */}
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Equipment ID:
              </Text>
              <Text fontSize="sm" color="gray.900" fontWeight="normal" fontFamily="mono">
                {equipment.equipmentId || '-'}
              </Text>
            </HStack>

            {/* SKU */}
            {equipment.sku && (
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  SKU:
                </Text>
                <Text fontSize="sm" color="gray.900" fontWeight="normal" fontFamily="mono">
                  {equipment.sku}
                </Text>
              </HStack>
            )}

            {/* Next Service Due */}
            {equipment.nextServiceDue && (
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  Next Service:
                </Text>
                <Text fontSize="sm" color="gray.900" fontWeight="normal">
                  {format(new Date(equipment.nextServiceDue), 'MMM dd, yyyy')}
                </Text>
              </HStack>
            )}
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

