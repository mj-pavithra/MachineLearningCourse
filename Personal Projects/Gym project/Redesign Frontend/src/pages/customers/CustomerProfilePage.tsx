import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  Skeleton,
  Collapsible,
  SimpleGrid,
  Table,
  Center,
  Card,
  Menu,
  IconButton,
} from '@chakra-ui/react';
import { ModernButton } from '@/components/ui/ModernButton';
import { HiArrowLeft, HiChevronDown, HiChevronUp, HiDotsVertical } from 'react-icons/hi';
import { formatDate, formatCurrency, formatDayName } from '@/components/dashboard/utils/formatters';
import {
  fetchCustomerByClientId,
  fetchEmergencyContactsByClientId,
  fetchBodyConditionsByClientId,
} from '@/services/api/customers';
import { fetchClientPayments } from '@/services/api/finances';
import { getAttendancesByCustomerId, Attendance } from '@/services/api/attendance';
import { queryKeys } from '@/services/api/queryKeys';
import { IndividualCustomer, EmergencyContact, BodyCondition } from '@/types/customer';
import { Payment } from '@/types/finance';
import { useToast } from '@/utils/toast';
import { getErrorMessage } from '@/utils/error';
import { getWhatsAppUrl } from '@/utils/whatsapp';

export default function CustomerProfilePage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  // Collapsible section states
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(true);
  const [isEmergencyContactOpen, setIsEmergencyContactOpen] = useState(false);
  const [isBodyConditionOpen, setIsBodyConditionOpen] = useState(false);
  const [isAttendanceExpanded, setIsAttendanceExpanded] = useState(false);
  const [isPaymentsExpanded, setIsPaymentsExpanded] = useState(false);

  // Fetch customer data
  const {
    data: customer,
    isLoading: isLoadingCustomer,
    error: customerError,
  } = useQuery<IndividualCustomer>({
    queryKey: queryKeys.customers.profile.detail(clientId || ''),
    queryFn: () => fetchCustomerByClientId(clientId!),
    enabled: !!clientId,
  });

  // Fetch emergency contacts
  const {
    data: emergencyContacts = [],
    isLoading: isLoadingEmergencyContacts,
  } = useQuery<EmergencyContact[]>({
    queryKey: queryKeys.customers.profile.emergencyContacts(clientId || ''),
    queryFn: () => fetchEmergencyContactsByClientId(clientId!),
    enabled: !!clientId,
  });

  // Fetch body conditions
  const {
    data: bodyConditions = [],
    isLoading: isLoadingBodyConditions,
  } = useQuery<BodyCondition[]>({
    queryKey: queryKeys.customers.profile.bodyConditions(clientId || ''),
    queryFn: () => fetchBodyConditionsByClientId(clientId!),
    enabled: !!clientId,
  });

  // Fetch payments (only when payments section is expanded)
  const {
    data: paymentsData,
    isLoading: isLoadingPayments,
  } = useQuery({
    queryKey: queryKeys.customers.profile.payments(clientId || ''),
    queryFn: () =>
      fetchClientPayments({
        page: 1,
        size: 100,
        paidFor: clientId,
      }),
    enabled: !!clientId && isPaymentsExpanded,
  });

  // Fetch attendance (only when attendance section is expanded)
  const {
    data: customerAttendance = [],
    isLoading: isLoadingAttendance,
    error: attendanceError,
  } = useQuery<Attendance[]>({
    queryKey: queryKeys.customers.profile.attendance(clientId || ''),
    queryFn: () => getAttendancesByCustomerId(clientId!, { size: 100 }),
    enabled: !!clientId && isAttendanceExpanded, // Only fetch when section is expanded
    retry: 1, // Only retry once on failure
    retryDelay: 2000, // Wait 2 seconds before retry
  });

  // Show error toast
  useEffect(() => {
    if (customerError) {
      toast.create({
        title: 'Error',
        description: getErrorMessage(customerError),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [customerError, toast]);

  // Show attendance error toast
  useEffect(() => {
    if (attendanceError) {
      toast.create({
        title: 'Error Loading Attendance',
        description: getErrorMessage(attendanceError),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [attendanceError, toast]);

  if (!clientId) {
    return (
      <Center minH="400px">
        <VStack gap={4}>
          <Text color="gray.500">Invalid customer ID</Text>
          <ModernButton onClick={() => navigate('/customers')}>Back to Customers</ModernButton>
        </VStack>
      </Center>
    );
  }

  if (isLoadingCustomer) {
    return (
      <Box p={{ base: 4, md: 6, lg: 8 }}>
        <VStack align="stretch" gap={6}>
          <Skeleton height="40px" width="200px" />
          <Skeleton height="300px" />
          <Skeleton height="200px" />
          <Skeleton height="200px" />
        </VStack>
      </Box>
    );
  }

  if (!customer) {
    return (
      <Center minH="400px">
        <VStack gap={4}>
          <Text color="gray.500">Customer not found</Text>
          <ModernButton onClick={() => navigate('/customers')}>Back to Customers</ModernButton>
        </VStack>
      </Center>
    );
  }

  const payments = paymentsData?.items || paymentsData?.payments || [];

  return (
    <Box p={{ base: 4, md: 6, lg: 8 }} maxW="1400px" mx="auto">
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={{ base: 3, md: 4 }}>
          <HStack gap={{ base: 2, md: 4 }} flex={1} minW="200px">
            <ModernButton
              variant="ghost"
              size="sm"
              onClick={() => navigate('/customers')}
            >
              <HiArrowLeft style={{ marginRight: '8px' }} />
              Back
            </ModernButton>
            <VStack align="flex-start" gap={1}>
              <Heading
                fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
                fontWeight="bold"
              >
                {customer.firstName} {customer.lastName}
              </Heading>
              <HStack gap={2} flexWrap="wrap">
                <Text fontSize="sm" color="gray.600" fontFamily="mono">
                  ID: {customer.clientId}
                </Text>
                <Badge
                  colorPalette={customer.isActive ? 'green' : 'red'}
                  variant="subtle"
                >
                  {customer.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </HStack>
            </VStack>
          </HStack>
          <Menu.Root>
            <Menu.Trigger asChild>
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="Customer actions"
              >
                <HiDotsVertical />
              </IconButton>
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item value="edit" onClick={() => navigate(`/customers/edit/${customer.clientId}`)}>
                Edit Customer
              </Menu.Item>
              <Menu.Item value="view-payments" onClick={() => setIsPaymentsExpanded(true)}>
                View Payments
              </Menu.Item>
              <Menu.Item value="view-attendance" onClick={() => setIsAttendanceExpanded(true)}>
                View Attendance
              </Menu.Item>
            </Menu.Content>
          </Menu.Root>
        </HStack>

        {/* Collapsible Sections */}
        <VStack align="stretch" gap={{ base: 3, md: 4 }}>
          {/* Personal Information */}
          <Collapsible.Root
            open={isPersonalInfoOpen}
            onOpenChange={(e) => setIsPersonalInfoOpen(e.open)}
          >
            <Collapsible.Trigger asChild>
              <ModernButton
                variant="ghost"
                width="100%"
                justifyContent="space-between"
                fontWeight="semibold"
                fontSize="lg"
                py={6}
                _hover={{ bg: 'gray.50' }}
              >
                <Text>Personal Information</Text>
                {isPersonalInfoOpen ? <HiChevronUp /> : <HiChevronDown />}
              </ModernButton>
            </Collapsible.Trigger>
            <Collapsible.Content>
              <Box
                p={{ base: 4, md: 6 }}
                bg="gray.50"
                borderRadius="md"
                mt={2}
              >
                <VStack align="stretch" gap={{ base: 4, md: 5 }}>
                  {/* Basic Information Section */}
                  <Box
                    bg="white"
                    borderRadius="md"
                    p={{ base: 4, md: 5 }}
                    borderWidth="1px"
                    borderColor="gray.200"
                  >
                    <Heading
                      fontSize="md"
                      fontWeight="semibold"
                      color="gray.700"
                      mb={3}
                    >
                      Basic Information
                    </Heading>
                    <SimpleGrid
                      columns={{ base: 1, sm: 2, md: 2, lg: 3 }}
                      gap={{ base: 3, md: 4 }}
                    >
                      <InfoField label="Name" value={customer.firstName + ' ' + customer.lastName} />
                      <InfoField label="Email" value={customer.email} />
                      <InfoField label="Mobile Number" value={customer.mobileNumber} isPhoneNumber />
                      <InfoField label="NIC" value={customer.nic} />
                    </SimpleGrid>
                  </Box>

                  {/* Address Section */}
                  <Box
                    bg="white"
                    borderRadius="md"
                    p={{ base: 4, md: 5 }}
                    borderWidth="1px"
                    borderColor="gray.200"
                  >
                    <Heading
                      fontSize="md"
                      fontWeight="semibold"
                      color="gray.700"
                      mb={3}
                    >
                      Address
                    </Heading>
                    <InfoField label="Address" value={customer.addressLine1 + ' ' + customer.addressLine2} />
                  </Box>

                  {/* Personal Details Section */}
                  <Box
                    bg="white"
                    borderRadius="md"
                    p={{ base: 4, md: 5 }}
                    borderWidth="1px"
                    borderColor="gray.200"
                  >
                    <Heading
                      fontSize="md"
                      fontWeight="semibold"
                      color="gray.700"
                      mb={3}
                    >
                      Personal Details
                    </Heading>
                    <SimpleGrid
                      columns={{ base: 1, sm: 2, md: 2, lg: 3 }}
                      gap={{ base: 3, md: 4 }}
                    >
                      <InfoField
                        label="Date of Birth"
                        value={formatDate(customer.dob)}
                      />
                      <InfoField
                        label="Gender"
                        value={customer.isMale ? 'Male' : 'Female'}
                      />
                      <InfoField
                        label="Marital Status"
                        value={customer.isMarried ? 'Married' : 'Single'}
                      />
                      <InfoField label="Profession" value={customer.profession} />
                      <InfoField label="Why Join" value={customer.whyJoin} />
                    </SimpleGrid>
                  </Box>

                  {/* Membership Information Section */}
                  <Box
                    bg="white"
                    borderRadius="md"
                    p={{ base: 4, md: 5 }}
                    borderWidth="1px"
                    borderColor="gray.200"
                  >
                    <Heading
                      fontSize="md"
                      fontWeight="semibold"
                      color="gray.700"
                      mb={3}
                    >
                      Membership Information
                    </Heading>
                    <SimpleGrid
                      columns={{ base: 1, sm: 2, md: 2, lg: 3 }}
                      gap={{ base: 3, md: 4 }}
                    >
                      <InfoField label="Package" value={customer.package_name} />
                      <InfoField
                        label="Available Sessions"
                        value={customer.availableSessionQuota?.toString()}
                      />
                      <InfoField label="Reference" value={customer.reference} />
                    </SimpleGrid>
                  </Box>

                  {/* System Information Section */}
                  <Box
                    bg="white"
                    borderRadius="md"
                    p={{ base: 4, md: 5 }}
                    borderWidth="1px"
                    borderColor="gray.200"
                  >
                    <Heading
                      fontSize="sm"
                      fontWeight="semibold"
                      color="gray.600"
                      mb={3}
                    >
                      System Information
                    </Heading>
                    <SimpleGrid
                      columns={{ base: 1, sm: 2, md: 2, lg: 3 }}
                      gap={{ base: 3, md: 4 }}
                    >
                      <InfoField
                        label="Created Date"
                        value={formatDate(customer.createdAt)}
                      />
                      <InfoField
                        label="Updated Date"
                        value={formatDate(customer.updatedAt)}
                      />
                    </SimpleGrid>
                  </Box>
                </VStack>
              </Box>
            </Collapsible.Content>
          </Collapsible.Root>

          {/* Emergency Contact */}
          <Collapsible.Root
            open={isEmergencyContactOpen}
            onOpenChange={(e) => setIsEmergencyContactOpen(e.open)}
          >
            <Collapsible.Trigger asChild>
              <ModernButton
                variant="ghost"
                width="100%"
                justifyContent="space-between"
                fontWeight="semibold"
                fontSize="lg"
                py={6}
                _hover={{ bg: 'gray.50' }}
              >
                <Text>Emergency Contact</Text>
                {isEmergencyContactOpen ? <HiChevronUp /> : <HiChevronDown />}
              </ModernButton>
            </Collapsible.Trigger>
            <Collapsible.Content>
              <Box
                p={{ base: 4, md: 6 }}
                bg="gray.50"
                borderRadius="md"
                mt={2}
              >
                {isLoadingEmergencyContacts ? (
                  <Skeleton height="100px" />
                ) : emergencyContacts.length === 0 ? (
                  <Text color="gray.500" textAlign="center" py={4}>
                    No emergency contacts found
                  </Text>
                ) : (
                  <SimpleGrid
                    columns={{ base: 1, sm: 2, md: 3 }}
                    gap={{ base: 3, md: 4 }}
                  >
                    {emergencyContacts.map((contact) => (
                      <Box
                        key={contact._id}
                        p={4}
                        bg="white"
                        borderRadius="md"
                        borderWidth="1px"
                      >
                        <VStack align="flex-start" gap={2}>
                          <InfoField label="Name" value={contact.name} />
                          <InfoField
                            label="Mobile Number"
                            value={contact.mobileNumber}
                            isPhoneNumber
                          />
                          <InfoField
                            label="Relationship"
                            value={contact.relationship}
                          />
                          <InfoField
                            label="Created Date"
                            value={formatDate(contact.createdAt)}
                          />
                        </VStack>
                      </Box>
                    ))}
                  </SimpleGrid>
                )}
              </Box>
            </Collapsible.Content>
          </Collapsible.Root>

          {/* Body Condition */}
          <Collapsible.Root
            open={isBodyConditionOpen}
            onOpenChange={(e) => setIsBodyConditionOpen(e.open)}
          >
            <Collapsible.Trigger asChild>
              <ModernButton
                variant="ghost"
                width="100%"
                justifyContent="space-between"
                fontWeight="semibold"
                fontSize="lg"
                py={6}
                _hover={{ bg: 'gray.50' }}
              >
                <Text>Body Condition</Text>
                {isBodyConditionOpen ? <HiChevronUp /> : <HiChevronDown />}
              </ModernButton>
            </Collapsible.Trigger>
            <Collapsible.Content>
              <Box
                p={{ base: 4, md: 6 }}
                bg="gray.50"
                borderRadius="md"
                mt={2}
              >
                {isLoadingBodyConditions ? (
                  <Skeleton height="200px" />
                ) : bodyConditions.length === 0 ? (
                  <Text color="gray.500" textAlign="center" py={4}>
                    No body condition data found
                  </Text>
                ) : (
                  <SimpleGrid
                    columns={{ base: 1, md: 2 }}
                    gap={{ base: 3, md: 4 }}
                  >
                    {bodyConditions.map((condition) => (
                      <Box
                        key={condition._id}
                        p={4}
                        bg="white"
                        borderRadius="md"
                        borderWidth="1px"
                      >
                        <VStack align="flex-start" gap={3}>
                          <Badge
                            colorPalette={condition.state === 'current' ? 'blue' : 'purple'}
                            variant="subtle"
                          >
                            {condition.state === 'current' ? 'Current' : 'Target'}
                          </Badge>
                          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={{ base: 2, md: 2 }} width="100%">
                            <InfoField label="Body Type" value={condition.bodyType} />
                            <InfoField
                              label="Weight"
                              value={`${condition.weight} kg`}
                            />
                            <InfoField
                              label="Height"
                              value={`${condition.height} cm`}
                            />
                            <InfoField
                              label="Chest"
                              value={`${condition.chestMeasurement} cm`}
                            />
                            <InfoField
                              label="Arm"
                              value={`${condition.armMeasurement} cm`}
                            />
                            <InfoField
                              label="Hip"
                              value={`${condition.hipMeasurement} cm`}
                            />
                            <InfoField
                              label="Waist"
                              value={`${condition.waistMeasurement} cm`}
                            />
                            <InfoField
                              label="Thigh"
                              value={`${condition.thighMeasurement} cm`}
                            />
                          </SimpleGrid>
                          <InfoField
                            label="Created Date"
                            value={formatDate(condition.createdAt)}
                          />
                        </VStack>
                      </Box>
                    ))}
                  </SimpleGrid>
                )}
              </Box>
            </Collapsible.Content>
          </Collapsible.Root>
        </VStack>

        {/* Payment History Table */}
        <Box>
          <HStack justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
            <Heading fontSize="xl" fontWeight="bold">Payment History</Heading>
            {!isPaymentsExpanded && (
              <ModernButton
                size="sm"
                variant="outline"
                onClick={() => setIsPaymentsExpanded(true)}
              >
                Load Data
              </ModernButton>
            )}
          </HStack>
          {isPaymentsExpanded && (
            <Card.Root
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              shadow="none"
              bg="white"
            >
              <Card.Body p={{ base: 4, md: 6 }}>
                {isLoadingPayments ? (
                  <VStack gap={3} align="stretch">
                    <Skeleton height="40px" />
                    <Skeleton height="40px" />
                    <Skeleton height="40px" />
                    <Skeleton height="40px" />
                  </VStack>
                ) : payments.length === 0 ? (
                  <Center py={8}>
                    <VStack gap={2}>
                      <Text color="gray.500" fontSize="sm" fontWeight="medium">
                        No payment history found
                      </Text>
                      <Text color="gray.400" fontSize="xs">
                        Payment records will appear here once available
                      </Text>
                    </VStack>
                  </Center>
                ) : (
                  <Box overflowX="auto">
                    <Table.Root variant="outline" size="md">
                      <Table.Header>
                        <Table.Row bg="gray.50">
                          <Table.ColumnHeader
                            fontWeight="semibold"
                            color="gray.700"
                            fontSize="sm"
                            py={3}
                          >
                            Date
                          </Table.ColumnHeader>
                          <Table.ColumnHeader
                            fontWeight="semibold"
                            color="gray.700"
                            fontSize="sm"
                            py={3}
                          >
                            Month
                          </Table.ColumnHeader>
                          <Table.ColumnHeader
                            fontWeight="semibold"
                            color="gray.700"
                            fontSize="sm"
                            py={3}
                          >
                            Reference
                          </Table.ColumnHeader>
                          <Table.ColumnHeader
                            fontWeight="semibold"
                            color="gray.700"
                            fontSize="sm"
                            py={3}
                            textAlign="right"
                          >
                            Amount
                          </Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {payments.map((payment: Payment) => (
                          <Table.Row
                            key={payment._id}
                            bg={payment.isExtra ? 'red.50' : 'white'}
                            _hover={{
                              bg: payment.isExtra ? 'red.100' : 'gray.50',
                            }}
                            transition="background-color 0.2s"
                          >
                            <Table.Cell
                              py={3}
                              fontSize="sm"
                              color="gray.900"
                            >
                              {formatDate(payment.createdAt, 'MMM dd, yyyy')}
                            </Table.Cell>
                            <Table.Cell
                              py={3}
                              fontSize="sm"
                              color="gray.700"
                            >
                              {payment.month || '-'}
                            </Table.Cell>
                            <Table.Cell
                              py={3}
                              fontSize="sm"
                              color="gray.700"
                            >
                              {payment.reference || '-'}
                            </Table.Cell>
                            <Table.Cell
                              py={3}
                              fontSize="sm"
                              fontWeight="semibold"
                              color="gray.900"
                              textAlign="right"
                            >
                              {formatCurrency(payment.amount)}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                )}
              </Card.Body>
            </Card.Root>
          )}
        </Box>

        {/* Attendance History Table */}
        <Box>
          <HStack justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
            <Heading fontSize="xl" fontWeight="bold">Attendance History</Heading>
            {!isAttendanceExpanded && (
              <ModernButton
                size="sm"
                variant="outline"
                onClick={() => setIsAttendanceExpanded(true)}
              >
                Load Data
              </ModernButton>
            )}
          </HStack>
          {isAttendanceExpanded && (
            <Card.Root
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              shadow="none"
              bg="white"
            >
              <Card.Body p={{ base: 4, md: 6 }}>
                {isLoadingAttendance ? (
                  <VStack gap={3} align="stretch">
                    <Skeleton height="40px" />
                    <Skeleton height="40px" />
                    <Skeleton height="40px" />
                    <Skeleton height="40px" />
                  </VStack>
                ) : attendanceError ? (
                  <Center py={8}>
                    <VStack gap={2}>
                      <Text color="red.500" fontSize="sm" fontWeight="medium">
                        Failed to load attendance data
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {attendanceError instanceof Error ? attendanceError.message : 'Unknown error'}
                      </Text>
                    </VStack>
                  </Center>
                ) : customerAttendance.length === 0 ? (
                  <Center py={8}>
                    <VStack gap={2}>
                      <Text color="gray.500" fontSize="sm" fontWeight="medium">
                        No attendance records found
                      </Text>
                      <Text color="gray.400" fontSize="xs">
                        Attendance records will appear here once available
                      </Text>
                    </VStack>
                  </Center>
                ) : (
                  <Box overflowX="auto">
                    <Table.Root variant="outline" size="md">
                      <Table.Header>
                        <Table.Row bg="gray.50">
                          <Table.ColumnHeader
                            fontWeight="semibold"
                            color="gray.700"
                            fontSize="sm"
                            py={3}
                          >
                            Date
                          </Table.ColumnHeader>
                          <Table.ColumnHeader
                            fontWeight="semibold"
                            color="gray.700"
                            fontSize="sm"
                            py={3}
                          >
                            Day
                          </Table.ColumnHeader>
                          <Table.ColumnHeader
                            fontWeight="semibold"
                            color="gray.700"
                            fontSize="sm"
                            py={3}
                          >
                            Time
                          </Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {customerAttendance
                          .sort((a, b) => {
                            // Sort by date descending (most recent first)
                            const dateA = new Date(a.attendedDateTime).getTime();
                            const dateB = new Date(b.attendedDateTime).getTime();
                            return dateB - dateA;
                          })
                          .map((attendance, index) => {
                            const dateTime = new Date(attendance.attendedDateTime);
                            const dayName = formatDayName(dateTime, 'EEEE');
                            // Use attendanceId or _id as key, fallback to index
                            const key = attendance.attendanceId || attendance._id || `attendance-${index}`;
                            return (
                              <Table.Row
                                key={key}
                                _hover={{
                                  bg: 'gray.50',
                                }}
                                transition="background-color 0.2s"
                              >

                                <Table.Cell
                                  py={3}
                                  fontSize="sm"
                                  color="gray.900"
                                >
                                  {formatDate(dateTime, 'MMM dd, yyyy')}
                                </Table.Cell>
                                <Table.Cell
                                  py={3}
                                  fontSize="sm"
                                  color="gray.700"
                                >
                                  <Badge
                                    variant="subtle"
                                    colorPalette="blue"
                                    fontSize="xs"
                                  >
                                    {dayName}
                                  </Badge>
                                </Table.Cell>
                                <Table.Cell
                                  py={3}
                                  fontSize="sm"
                                  color="gray.700"
                                  fontFamily="mono"
                                >
                                  {formatDate(dateTime, 'HH:mm:ss')}
                                </Table.Cell>
                              </Table.Row>
                            );
                          })}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                )}
              </Card.Body>
            </Card.Root>
          )}
        </Box>
      </VStack>
    </Box>
  );
}

// Helper component for info fields
function InfoField({ label, value, isPhoneNumber }: { label: string; value?: string | null; isPhoneNumber?: boolean }) {
  const whatsappUrl = isPhoneNumber && value ? getWhatsAppUrl(value) : null;
  
  return (
    <VStack align="flex-start" gap={1}>
      <Text fontSize="xs" color="gray.600" fontWeight="medium">
        {label}
      </Text>
      {whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '0.875rem',
            color: '#3182ce',
            fontWeight: 'normal',
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#2c5282';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#3182ce';
          }}
        >
          {value}
        </a>
      ) : (
        <Text fontSize="sm" color="gray.900">
          {value || '-'}
        </Text>
      )}
    </VStack>
  );
}

