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
import { Trainer } from '@/types/trainer';

export interface TrainerCardProps {
  trainer: Trainer;
  isLoading?: boolean;
  onEdit?: (trainer: Trainer) => void;
  actionMenuOpen?: string | null;
  onActionMenuChange?: (id: string | null) => void;
}

/**
 * Extract memberId from trainer (if available, otherwise use _id)
 */
function getMemberId(trainer: Trainer): string {
  // Check if memberId exists in trainer (from user's sample data)
  return (trainer as any).memberId || trainer._id || '-';
}

export function TrainerCard({
  trainer,
  isLoading = false,
  onEdit,
  actionMenuOpen,
  onActionMenuChange,
}: TrainerCardProps) {
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

  const { firstName, lastName } = trainer;
  const memberId = getMemberId(trainer);
  const isActive = trainer.isActive ?? true;
  const borderColor = isActive ? 'green.500' : 'red.500';
  const trainerId = trainer._id;

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
                {firstName} {lastName}
              </Text>
              <HStack gap={2} mt={1}>
                <Badge
                  colorPalette={isActive ? 'green' : 'red'}
                  variant="subtle"
                  fontSize="xs"
                >
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Badge
                  colorPalette={trainer.isFullTime ? 'blue' : 'purple'}
                  variant="subtle"
                  fontSize="xs"
                >
                  {trainer.isFullTime ? 'Full Time' : 'Part Time'}
                </Badge>
                {trainer.isAdmin && (
                  <Badge
                    colorPalette="orange"
                    variant="subtle"
                    fontSize="xs"
                  >
                    Admin
                  </Badge>
                )}
              </HStack>
            </Box>
            {onEdit && (
              <Menu.Root
                open={actionMenuOpen === trainerId}
                onOpenChange={(e) => onActionMenuChange?.(e.open ? trainerId : null)}
              >
                <Menu.Trigger asChild>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label={`Actions for ${firstName} ${lastName}`}
                  >
                    <HiDotsVertical />
                  </IconButton>
                </Menu.Trigger>
                <Menu.Content>
                  <Menu.Item
                    onClick={() => onEdit(trainer)}
                    value="edit"
                  >
                    <HiPencil />
                    Edit
                  </Menu.Item>
                </Menu.Content>
              </Menu.Root>
            )}
          </HStack>

          {/* Trainer Details */}
          <VStack align="stretch" gap={2} mt={2}>
            {/* Mobile Number */}
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Mobile:
              </Text>
              <Text fontSize="sm" color="gray.900" fontWeight="normal">
                {trainer.mobile || '-'}
              </Text>
            </HStack>

            {/* Member ID */}
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Member ID:
              </Text>
              <Text fontSize="sm" color="gray.900" fontWeight="normal" fontFamily="mono">
                {memberId}
              </Text>
            </HStack>

            {/* Email */}
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Email:
              </Text>
              <Text fontSize="sm" color="gray.900" fontWeight="normal">
                {trainer.email || '-'}
              </Text>
            </HStack>

            {/* NIC */}
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                NIC:
              </Text>
              <Text fontSize="sm" color="gray.900" fontWeight="normal" fontFamily="mono">
                {trainer.nic || '-'}
              </Text>
            </HStack>
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}


