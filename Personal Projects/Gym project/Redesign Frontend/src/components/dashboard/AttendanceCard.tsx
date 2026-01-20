import { Card, Box, VStack, HStack, Text } from '@chakra-ui/react';
import { ModernButton } from '@/components/ui/ModernButton';
import { HiUserGroup, HiCheckCircle, HiXCircle } from 'react-icons/hi';
import { AttendanceSummary } from '@/types/dashboard';
import { formatPercent } from './utils/formatters';
import { CircularProgress, CircularProgressLabel } from '@/components/ui/CircularProgress';

export interface AttendanceCardProps {
  data?: AttendanceSummary;
  loading?: boolean;
  onMarkAttendance?: () => void;
}

/**
 * Attendance card widget showing today's attendance summary
 * 
 * @example
 * ```tsx
 * <AttendanceCard
 *   data={attendanceData}
 *   loading={isLoading}
 *   onMarkAttendance={() => openMarkAttendanceSheet()}
 * />
 * ```
 */
export function AttendanceCard({ data, loading = false, onMarkAttendance }: AttendanceCardProps) {
  if (loading) {
    return (
      <Card.Root>
        <Card.Body>
          <VStack align="stretch" gap={4}>
            <Box>
              <Box height="120px" width="120px" borderRadius="full" bg="gray.100" mx="auto" />
            </Box>
            <VStack gap={2}>
              <Box height="16px" width="80%" bg="gray.100" borderRadius="md" />
              <Box height="16px" width="60%" bg="gray.100" borderRadius="md" />
            </VStack>
            <Box height="36px" width="100%" bg="gray.100" borderRadius="md" />
          </VStack>
        </Card.Body>
      </Card.Root>
    );
  }

  if (!data) {
    return (
      <Card.Root>
        <Card.Body>
          <VStack align="stretch" gap={4} textAlign="center" py={4}>
            <Text color="gray.500" fontSize="sm">
              No attendance data available
            </Text>
          </VStack>
        </Card.Body>
      </Card.Root>
    );
  }

  const { registered, present, absent, presentPercent } = data;

  return (
    <Card.Root>
      <Card.Body p={{ base: 3, md: 4, lg: 5 }}>
        <VStack align="stretch" gap={{ base: 3, md: 4 }}>
          {/* Title */}
          <Text fontSize="md" fontWeight="semibold" color="gray.900">
            Today's Attendance
          </Text>

          {/* Circular progress */}
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress
              value={presentPercent}
              size="120px"
              thickness="8px"
              color={presentPercent >= 70 ? 'green' : presentPercent >= 50 ? 'yellow' : 'red'}
            >
              <CircularProgressLabel>
                <VStack gap={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="gray.900">
                    {formatPercent(presentPercent, 0)}
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    Present
                  </Text>
                </VStack>
              </CircularProgressLabel>
            </CircularProgress>
          </Box>

          {/* Stats */}
          <VStack align="stretch" gap={2}>
            <HStack justify="space-between">
              <HStack gap={2}>
                <HiUserGroup color="gray" size={16} />
                <Text fontSize="sm" color="gray.600">
                  Registered
                </Text>
              </HStack>
              <Text fontSize="sm" fontWeight="semibold" color="gray.900">
                {registered}
              </Text>
            </HStack>

            <HStack justify="space-between">
              <HStack gap={2}>
                <HiCheckCircle color="green" size={16} />
                <Text fontSize="sm" color="gray.600">
                  Present
                </Text>
              </HStack>
              <Text fontSize="sm" fontWeight="semibold" color="green.600">
                {present}
              </Text>
            </HStack>

            <HStack justify="space-between">
              <HStack gap={2}>
                <HiXCircle color="red" size={16} />
                <Text fontSize="sm" color="gray.600">
                  Absent
                </Text>
              </HStack>
              <Text fontSize="sm" fontWeight="semibold" color="red.600">
                {absent}
              </Text>
            </HStack>
          </VStack>

          {/* Mark Attendance button */}
          {onMarkAttendance && (
            <ModernButton
              colorPalette="blue"
              size="sm"
              width="full"
              onClick={onMarkAttendance}
              mt={2}
            >
              Mark Attendance
            </ModernButton>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}


