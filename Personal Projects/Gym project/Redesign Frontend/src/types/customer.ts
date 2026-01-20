import { CommonResponseDataType } from "./common";

export interface Customer {
  // _id: string;
  clientId: string;
  name: string;
  nic: string;
  email: string;
  mobileNumber: string;
  packageId: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isPaid: boolean;
  package_name: string;
  groupMembersNames: any[];
  currentSession?: number;
  groupMembers?: { clientId: string; name: string }[];
  isOnFPmachine?: boolean | string;
}

export interface FetchedCustomer {
  clientId: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  nic?: string;
  mobileNumber?: string;
  packageId?: string;
  fee?: number;
  isActive?: boolean;
  isPaid?: boolean;
  isOnFPmachine?: boolean | string;
}

export interface FetchedGroupCustomer {
  clientId: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  nic?: string;
  mobileNumber?: string;
  packageId?: string;
  fee?: number;
  isActive?: boolean;
  isPaid?: boolean;
  relationToPrimaryMember?: string;
  isPrimaryMember?: boolean;
  group_id?: string;
  number_of_members?: number;
  package_name?: string;
  groupId?: string;
  availableSessionQuota?: number;
  groupMembersNames?: string[];
}

export type DeactivateCustomerResponse =
  | string
  | { status: "SUCCESS" | "FAIL"; message?: string; data?: any }
  | CommonResponseDataType;

export type IndividualCustomer = {
  clientId: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  email: string;
  nic: string;
  mobileNumber: string;
  packageId: string;
  fee: number;
  isActive: boolean;
  isPaid: boolean;
  package_name: string;
  availableSessionQuota: number;
  groupId?: string;
  whyJoin: string;
  profession: string;
  dob: string;
  isMale: boolean;
  isMarried: boolean;
  deactivateAt?: string;
  reference?: string;
  relationship?: string;
  profilePicture?: string;
  isOnFPmachine?: boolean | string;
};

export type NewIndividualCustomer = {
  clientId: string;
  firstName: string;
  lastName: string;
  nic: string;
  addressLine1: string;
  addressLine2: string;
  email: string;
  mobileNumber: string;
  packageId: string;
  isMale: boolean;
  dob: string;
  isMarried: boolean;
  whyJoin: string;
  profession: string;
  deactivateAt?: string;
  reference?: string;
};

export type GroupMember = {
  id: string;
  clientId: string;
  name: string;
  relationship: string;
  packageId: string;
};

export type GroupApiResponse = {
  groupId: string;
  createdAt: string;
  status: string;
  members: GroupMember[];
};

export type GroupShort = {
  _id: string;
  createdAt: string;
  updatedAt?: string;
  primaryMember: string;
  number_of_members: number;
  package_name: string;
  status: string;
  groupId: string;
};

export type GroupFull = {
  _id: string;
  createdAt: string;
  updatedAt?: string;
  primaryMember: string;
  number_of_members: number;
  package_name: string;
  status: string;
  members: GroupCustomer[];
  groupId: string;
};

export type GroupCustomer = {
  clientId: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  nic: string;
  mobileNumber: string;
  relationToPrimaryMember: string;
  isPrimaryMember: boolean;
  packageId: string;
  fee: number;
  isActive: boolean;
  isPaid: boolean;
  group_id: string;
  number_of_members: number;
  package_name: string;
  availableSessionQuota: number;
  groupId?: string;
  deactivateAt?: string;
  reference?: string;
  isOnFPmachine?: boolean | string;
};

export type CustomerView = {
  customer: {
    clientId: string;
    createdAt: string;
    updatedAt: string;
    status: string;
    firstName: string;
    lastName: string;
    mobileNumber: string;
    email: string;
    nic: string;
    packageId: string;
    fee: number;
    isActive: boolean;
    isPaid: boolean;
  };
  paymentHistory: PaymentHistory[];
  packageHistory: PackageHistory[];
};

export type PaymentHistory = {
  _id: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  month: string;
  amount: number;
  paidFor: string;
  isExtra: string;
  paymentId: string;
};

export type AttendanceHistory = {
  _id: string;
  attendedDateTime: string;
};

type PackageHistory = {
  _id: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  customerOrGroupId: string;
  amount: number;
  paymentFor: string;
  type: string;
  packageId: string;
  totalPayments: number;
  package: {
    _id: string;
    createdAt: string;
    updatedAt: string;
    status: string;
    sessions_allocated: number;
    package_name: string;
  };
};

/**
 * Customer form values for create/edit
 */
export interface CustomerFormValues {
  firstName: string;
  lastName: string;
  email?: string;
  mobileNumber: string;
  nic?: string;
  packageId: string;
  fee: number;
  isActive: boolean;
  availableSessionQuota: number;
  profilePicture?: string;
  groupId?: string;
  addressLine1?: string;
  addressLine2?: string;
  isMale?: boolean;
  dob?: string;
  isMarried?: boolean;
  whyJoin?: string;
  profession?: string;
  reference?: string;
}

/**
 * Customer filters for list view
 */
export interface CustomersFilters {
  search?: string;
  type?: 'individual' | 'group';
  packageId?: string;
  paymentStatus?: 'paid' | 'unpaid' | 'pending';
  isActive?: boolean;
  trainerId?: string;
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
}

/**
 * Customer table sort configuration
 */
export interface CustomerSort {
  field: 'name' | 'fee' | 'status' | 'availableSessions' | 'createdAt';
  direction: 'asc' | 'desc';
}

/**
 * Customer list query parameters
 */
export interface CustomerListParams {
  page: number;
  limit: number;
  filters?: CustomersFilters;
  sort?: CustomerSort;
}

/**
 * Emergency Contact interface
 */
export interface EmergencyContact {
  _id: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  mobileNumber: string;
  relationship: string;
  status: string;
}

/**
 * Body Condition interface
 */
export interface BodyCondition {
  _id: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  state: string; // "current" or "target"
  bodyType: string;
  weight: number;
  height: number;
  chestMeasurement: number;
  armMeasurement: number;
  hipMeasurement: number;
  waistMeasurement: number;
  thighMeasurement: number;
  status: string;
}


