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
import { HiPencil, HiDotsVertical, HiCheckCircle } from 'react-icons/hi';
import { format } from 'date-fns';
import { PTSession, DocumentStatus, AttendanceStatus } from '@/types/session';
import { ModernButton } from '@/components/ui/ModernButton';

export interface SessionCardProps {
  session: PTSession;
  isLoading?: boolean;
  onEdit?: (session: PTSession) => void;
  onMarkAttendance?: (session: PTSession) => void;
  onCancel?: (session: PTSession) => void;
  actionMenuOpen?: string | null;
  onActionMenuChange?: (id: string | null) => void;
}

/**
 * Get attendance color
 */
function getAttendanceColor(attendance?: AttendanceStatus | string): 'green' | 'yellow' | 'red' | 'gray' {
  if (!attendance) return 'gray';
  
  switch (attendance) {
    case 'attended':
      return 'green';
    case 'missed':
      return 'yellow';
    case 'cancelled':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Get border color based on attendance
 */
function getBorderColor(attendance?: AttendanceStatus | string): string {
  if (!attendance) return 'gray.500';
  
  switch (attendance) {
    case 'attended':
      return 'green.500';
    case 'missed':
      return 'yellow.500';
    case 'cancelled':
      return 'red.500';
    default:
      return 'gray.500';
  }
}

/**
 * Get status color
 */
function getStatusColor(status: DocumentStatus | string): 'green' | 'red' | 'gray' {
  if (status === DocumentStatus.ACTIVE || status === 'ACTIVE') {
    return 'green';
  }
  if (status === DocumentStatus.INACTIVE || status === 'INACTIVE') {
    return 'red';
  }
  return 'gray';
}

/**
 * Get status label
 */
function getStatusLabel(status: DocumentStatus | string): string {
  if (status === DocumentStatus.ACTIVE || status === 'ACTIVE') {
    return 'ACTIVE';
  }
  if (status === DocumentStatus.INACTIVE || status === 'INACTIVE') {
    return 'INACTIVE';
  }
  return String(status);
}

/**
 * Get attendance label
 */
function getAttendanceLabel(attendance?: AttendanceStatus | string): string {
  if (!attendance) return 'Pending';
  
  switch (attendance) {
    case 'attended':
      return 'Attended';
    case 'missed':
      return 'Missed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Pending';
  }
}

export function SessionCard({
  session,
  isLoading = false,
  onEdit,
  onMarkAttendance,
  onCancel,
  actionMenuOpen,
  onActionMenuChange,
}: SessionCardProps) {
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

  const sessionId = session._id || 'Unknown';
  const attendance = session.attendance;
  const status = session.status || DocumentStatus.ACTIVE;
  const borderColor = getBorderColor(attendance);
  const attendanceColor = getAttendanceColor(attendance);
  const statusColor = getStatusColor(status);
  const customerName = session.customerName || session.customer_name || 'Unknown Customer';
  const trainerName = session.trainerName || session.trainer_name || 'Unknown Trainer';

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
          {/* Header with session info and actions */}
          <HStack justify="space-between" align="flex-start">
            <Box flex={1}>
              <Text fontSize="lg" fontWeight="semibold" color="gray.900" mb={1}>
                Session #{sessionId.slice(-8)}
              </Text>
              <HStack gap={2} mt={1} flexWrap="wrap">
                <Badge
                  colorPalette={attendanceColor}
                  variant="subtle"
                  fontSize="xs"
                >
                  {getAttendanceLabel(attendance)}
                </Badge>
                <Badge
                  colorPalette={statusColor}
                  variant="subtle"
                  fontSize="xs"
                >
                  {getStatusLabel(status)}
                </Badge>
                {session.isExtra && (
                  <Badge
                    colorPalette="purple"
                    variant="subtle"
                    fontSize="xs"
                  >
                    Extra Session
                  </Badge>
                )}
              </HStack>
            </Box>
            {(onEdit || onMarkAttendance || onCancel) && (
              <Menu.Root
                open={actionMenuOpen === sessionId}
                onOpenChange={(e) => onActionMenuChange?.(e.open ? sessionId : null)}
              >
                <Menu.Trigger asChild>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label={`Actions for session ${sessionId}`}
                  >
                    <HiDotsVertical />
                  </IconButton>
                </Menu.Trigger>
                <Menu.Content>
                  {onMarkAttendance && attendance !== 'attended' && (
                    <Menu.Item
                      onClick={() => onMarkAttendance(session)}
                      value="mark-attendance"
                    >
                      <HiCheckCircle />
                      Mark Attended
                    </Menu.Item>
                  )}
                  {onEdit && (
                    <Menu.Item
                      onClick={() => onEdit(session)}
                      value="edit"
                    >
                      <HiPencil />
                      Edit
                    </Menu.Item>
                  )}
                  {onCancel && attendance !== 'cancelled' && (
                    <Menu.Item
                      onClick={() => onCancel(session)}
                      value="cancel"
                      colorPalette="orange"
                    >
                      Cancel Session
                    </Menu.Item>
                  )}
                </Menu.Content>
              </Menu.Root>
            )}
          </HStack>

          {/* Session Details */}
          <VStack align="stretch" gap={2} mt={2}>
            {/* Customer Name */}
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Customer:
              </Text>
              <Text fontSize="sm" color="gray.900" fontWeight="normal">
                {customerName}
              </Text>
            </HStack>

            {/* Trainer Name */}
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Trainer:
              </Text>
              <Text fontSize="sm" color="gray.900" fontWeight="normal">
                {trainerName}
              </Text>
            </HStack>

            {/* Current Session Number */}
            {session.current_session !== undefined && (
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  Session #:
                </Text>
                <Badge
                  colorPalette="blue"
                  variant="subtle"
                  fontSize="xs"
                >
                  {session.current_session}
                </Badge>
              </HStack>
            )}

            {/* Customer NIC */}
            {session.customer_nic && (
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  NIC:
                </Text>
                <Text fontSize="sm" color="gray.900" fontWeight="normal" fontFamily="mono">
                  {session.customer_nic}
                </Text>
              </HStack>
            )}

            {/* Created Date */}
            {session.createdAt && (
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  Created:
                </Text>
                <Text fontSize="sm" color="gray.900" fontWeight="normal">
                  {format(new Date(session.createdAt), 'MMM dd, yyyy')}
                </Text>
              </HStack>
            )}

            {/* Session ID */}
            <HStack justify="space-between">
              <Text fontSize="xs" color="gray.500">
                Session ID:
              </Text>
              <Text fontSize="xs" color="gray.500" fontFamily="mono">
                {sessionId.slice(-8)}
              </Text>
            </HStack>
          </VStack>

          {/* Quick Action: Mark Attendance */}
          {onMarkAttendance && attendance !== 'attended' && attendance !== 'cancelled' && (
            <Box mt={2}>
              <ModernButton
                size="sm"
                colorPalette="green"
                variant="outline"
                width="100%"
                onClick={() => onMarkAttendance(session)}
              >
                <HiCheckCircle />
                Mark as Attended
              </ModernButton>
            </Box>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

