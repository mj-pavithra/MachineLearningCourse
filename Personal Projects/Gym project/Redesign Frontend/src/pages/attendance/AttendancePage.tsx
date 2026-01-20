import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Heading,
  Text,
  HStack,
  VStack,
  Field,
  Input,
  Table,
  Badge,
  Center,
  Skeleton,
  Card,
} from '@chakra-ui/react';
import { format, parseISO, isSameDay, eachDayOfInterval } from 'date-fns';
import { getDailyAttendance, DailyAttendanceData, DailyAttendanceItem } from '@/services/api/attendance';
import { queryKeys } from '@/services/api/queryKeys';
import { useToast } from '@/utils/toast';
import { getErrorMessage } from '@/utils/error';
import { ModernButton } from '@/components/ui/ModernButton';

export default function AttendancePage() {
  const toast = useToast();
  
  // Default to current day
  const today = new Date();
  const [startDate, setStartDate] = useState<string>(format(today, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(today, 'yyyy-MM-dd'));

  // Fetch attendance data
  const { data: attendanceData, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.attendance?.daily({ startDate, endDate }) || ['attendance', 'daily', startDate, endDate],
    queryFn: async () => {
      // Convert dates to ISO format for API (start of day to end of day)
      const startISO = `${startDate}T00:00:00`;
      const endISO = `${endDate}T23:59:59`;
      
      const response = await getDailyAttendance({
        startDate: startISO,
        endDate: endISO,
      });
      
      return response;
    },
    enabled: !!startDate && !!endDate,
    staleTime: 60000, // 1 minute
  });

  // Group attendance data by date
  const attendanceByDate = useMemo(() => {
    if (!attendanceData?.data || !Array.isArray(attendanceData.data)) {
      return [];
    }

    // Sort by date (newest first)
    const sorted = [...attendanceData.data].sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateB.getTime() - dateA.getTime();
    });

    return sorted;
  }, [attendanceData]);

  // Get all dates in the range (for empty day placeholders)
  const dateRange = useMemo(() => {
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      return eachDayOfInterval({ start, end });
    } catch {
      return [];
    }
  }, [startDate, endDate]);

  // Handle date change
  const handleDateChange = () => {
    if (startDate && endDate) {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      
      if (start > end) {
        toast.create({
          title: 'Invalid Date Range',
          description: 'Start date cannot be after end date',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      refetch();
    }
  };

  // Reset to today
  const handleResetToToday = () => {
    const today = new Date();
    setStartDate(format(today, 'yyyy-MM-dd'));
    setEndDate(format(today, 'yyyy-MM-dd'));
  };

  useEffect(() => {
    document.title = 'Attendance • PayZhe';
  }, []);

  // Show error
  if (error) {
    return (
      <Box p={{ base: 4, md: 6, lg: 8 }}>
        <Card.Root
          borderRadius="xl"
          borderWidth="1px"
          borderColor="red.200"
          shadow="none"
          bg="white"
        >
          <Card.Body p={{ base: 8, md: 12 }}>
            <Center>
              <VStack gap={4}>
                <Text fontSize="lg" color="red.500" fontWeight="semibold">
                  Error loading attendance data
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center" maxW="400px">
                  {getErrorMessage(error)}
                </Text>
                <ModernButton
                  onClick={() => refetch()}
                  colorPalette="blue"
                  minH={{ base: '48px', md: '52px' }}
                  fontSize={{ base: 'md', md: 'lg' }}
                  borderRadius="xl"
                >
                  Retry
                </ModernButton>
              </VStack>
            </Center>
          </Card.Body>
        </Card.Root>
      </Box>
    );
  }

  return (
      <Box px={{ base: 3, md: 6, lg: 8 }} py={{ base: 3, md: 6, lg: 8 }}>
      {/* Header */}
      <HStack justify="space-between" align="center" mb={{ base: 4, md: 5, lg: 6 }} flexWrap="wrap" gap={{ base: 3, md: 4 }}>
        <Box>
          <Heading size={{ base: 'lg', md: 'xl' }} mb={{ base: 1, md: 2 }}>
            Attendance
          </Heading>
          <Text color="gray.600" fontSize="sm">
            View daily attendance records
          </Text>
        </Box>
      </HStack>

      {/* Date Range Selector */}
      <Card.Root
        mb={{ base: 4, md: 5, lg: 6 }}
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.200"
        shadow="none"
        bg="white"
      >
        <Card.Body p={{ base: 4, md: 5 }}>
          <VStack gap={{ base: 4, md: 5 }} align="stretch">
            <HStack gap={{ base: 3, md: 4 }} align="end" flexWrap="wrap">
              <Field.Root>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  Start Date
                </Field.Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontWeight="semibold" color="gray.700" mb={2.5}>
                  End Date
                </Field.Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.200"
                  bg="white"
                  minH={{ base: '48px', md: '52px' }}
                  fontSize={{ base: '16px', md: 'md' }}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  }}
                />
              </Field.Root>

              <ModernButton
                colorPalette="blue"
                onClick={handleDateChange}
                disabled={isLoading}
                minH={{ base: '48px', md: '52px' }}
                fontSize={{ base: 'md', md: 'lg' }}
                borderRadius="xl"
              >
                Apply
              </ModernButton>

              <ModernButton
                variant="outline"
                onClick={handleResetToToday}
                disabled={isLoading}
                minH={{ base: '48px', md: '52px' }}
                fontSize={{ base: 'md', md: 'lg' }}
                borderRadius="xl"
              >
                Today
              </ModernButton>
            </HStack>

            {/* Summary */}
            {attendanceData && (
              <Box
                pt={{ base: 3, md: 4 }}
                borderTopWidth="1px"
                borderColor="gray.200"
              >
                <HStack gap={{ base: 3, md: 4 }} flexWrap="wrap">
                  <Badge
                    colorPalette="blue"
                    variant="subtle"
                    fontSize="sm"
                    px={3}
                    py={1.5}
                  >
                    Total Records: {attendanceData.totalRecords || 0}
                  </Badge>
                  <Text fontSize="sm" color="gray.600">
                    Date Range: <Text as="span" fontWeight="semibold" color="gray.900">
                      {format(parseISO(startDate), 'MMM dd, yyyy')} - {format(parseISO(endDate), 'MMM dd, yyyy')}
                    </Text>
                  </Text>
                </HStack>
              </Box>
            )}
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Attendance Table - Day by Day */}
      {isLoading ? (
        <VStack gap={{ base: 4, md: 5, lg: 6 }} align="stretch">
          {[1, 2, 3].map((i) => (
            <Card.Root
              key={i}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              shadow="none"
              bg="white"
            >
              <Card.Body p={{ base: 4, md: 5 }}>
                <VStack gap={4} align="stretch">
                  <Skeleton height="32px" width="200px" />
                  <Skeleton height="200px" />
                </VStack>
              </Card.Body>
            </Card.Root>
          ))}
        </VStack>
      ) : attendanceByDate.length === 0 ? (
        <Card.Root
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.200"
          shadow="none"
          bg="white"
        >
          <Card.Body p={{ base: 8, md: 12 }}>
            <Center>
              <VStack gap={3}>
                <Text fontSize="lg" color="gray.500" fontWeight="medium">
                  No attendance records found
                </Text>
                <Text fontSize="sm" color="gray.400">
                  Try selecting a different date range
                </Text>
              </VStack>
            </Center>
          </Card.Body>
        </Card.Root>
      ) : (
        <VStack gap={{ base: 4, md: 5, lg: 6 }} align="stretch">
          {attendanceByDate.map((dayData: DailyAttendanceData) => (
            <Card.Root
              key={dayData.date}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              shadow="none"
              bg="white"
              overflow="hidden"
            >
              {/* Day Header */}
              <Box
                bg="gray.50"
                px={{ base: 4, md: 5 }}
                py={{ base: 3, md: 4 }}
                borderBottomWidth="1px"
                borderColor="gray.200"
              >
                <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
                  <HStack gap={3} flexWrap="wrap">
                    <Heading size="md" color="gray.900" fontWeight="bold">
                      {format(parseISO(dayData.date), 'EEEE, MMMM dd, yyyy')}
                    </Heading>
                    <Badge
                      colorPalette="blue"
                      variant="subtle"
                      fontSize="sm"
                      px={3}
                      py={1.5}
                    >
                      {dayData.totalCount || dayData.attendances?.length || 0} {dayData.totalCount === 1 ? 'record' : 'records'}
                    </Badge>
                  </HStack>
                </HStack>
              </Box>

              {/* Day Table */}
              {dayData.attendances && dayData.attendances.length > 0 ? (
                <Card.Body p={5}>
                  <Box overflowX="auto">
                    <Table.Root 
                    variant="outline" 
                    size="md"
                    py={3}
                    >
                      <Table.Header>
                        <Table.Row 
                        bg="gray.50"
                        
                        py={3}
                        >
                          <Table.ColumnHeader
                            fontWeight="semibold"
                            color="gray.700"
                            fontSize="sm"
                            py={3}
                          >
                            Time
                          </Table.ColumnHeader>
                          <Table.ColumnHeader
                            fontWeight="semibold"
                            color="gray.700"
                            fontSize="sm"
                            py={3}
                          >
                            Customer Name
                          </Table.ColumnHeader>
                          <Table.ColumnHeader
                            fontWeight="semibold"
                            color="gray.700"
                            fontSize="sm"
                            py={3}
                          >
                            Customer ID
                          </Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {dayData.attendances.map((attendance: DailyAttendanceItem, index: number) => (
                          <Table.Row
                            key={`${attendance.customerId}-${attendance.attendedDateTime}-${index}`}
                            _hover={{
                              bg: 'gray.50',
                            }}
                            transition="background-color 0.2s"
                          >
                            <Table.Cell
                              py={3}
                              fontSize="sm"
                              color="gray.700"
                              fontFamily="mono"
                            >
                              {attendance.time || format(parseISO(attendance.attendedDateTime), 'HH:mm:ss')}
                            </Table.Cell>
                            <Table.Cell
                              py={3}
                              fontSize="sm"
                              fontWeight="medium"
                              color="gray.900"
                            >
                              {attendance.firstName} {attendance.lastName}
                            </Table.Cell>
                            <Table.Cell
                              py={3}
                              fontSize="sm"
                              color="gray.600"
                              fontFamily="mono"
                            >
                              {attendance.customerId}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                </Card.Body>
              ) : (
                <Card.Body p={{ base: 6, md: 8 }}>
                  <Center>
                    <VStack gap={2}>
                      <Text color="gray.500" fontSize="sm" fontWeight="medium">
                        No attendance records for this day
                      </Text>
                      <Text color="gray.400" fontSize="xs">
                        No check-ins recorded
                      </Text>
                    </VStack>
                  </Center>
                </Card.Body>
              )}
            </Card.Root>
          ))}

          {/* Show empty days if any */}
          {dateRange.length > attendanceByDate.length && (
            <>
              {dateRange.map((date) => {
                const hasData = attendanceByDate.some((dayData) => 
                  isSameDay(parseISO(dayData.date), date)
                );
                
                if (hasData) return null;
                
                return (
                  <Card.Root
                    key={format(date, 'yyyy-MM-dd')}
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="gray.200"
                    shadow="none"
                    bg="white"
                    overflow="hidden"
                  >
                    <Box
                      bg="gray.50"
                      px={{ base: 4, md: 5 }}
                      py={{ base: 3, md: 4 }}
                      borderBottomWidth="1px"
                      borderColor="gray.200"
                    >
                      <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
                        <Heading size="md" color="gray.900" fontWeight="bold">
                          {format(date, 'EEEE, MMMM dd, yyyy')}
                        </Heading>
                        <Badge
                          colorPalette="gray"
                          variant="subtle"
                          fontSize="sm"
                          px={3}
                          py={1.5}
                        >
                          0 records
                        </Badge>
                      </HStack>
                    </Box>
                    <Card.Body p={{ base: 6, md: 8 }}>
                      <Center>
                        <VStack gap={2}>
                          <Text color="gray.500" fontSize="sm" fontWeight="medium">
                            No attendance records for this day
                          </Text>
                          <Text color="gray.400" fontSize="xs">
                            No check-ins recorded
                          </Text>
                        </VStack>
                      </Center>
                    </Card.Body>
                  </Card.Root>
                );
              })}
            </>
          )}
        </VStack>
      )}
    </Box>
  );
}

