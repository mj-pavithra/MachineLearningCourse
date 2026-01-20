export enum PaymentStatus {
  PAID = "PAID",
  NOT_PAID = "NOT_PAID",
}

export enum ClientType {
  INDIVIDUAL = "Individual",
  GROUP = "Group",
}

export enum DocumentStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ARCHIVED = "ARCHIVED",
  DELETED = "DELETED",
  CANCELED = "CANCELED",
}

export type AttendanceStatus = 'attended' | 'missed' | 'cancelled' | 'pending';

export interface PTSession {
  _id: string;
  createdAt: string;
  updatedAt: string;
  status: DocumentStatus | string;
  customerId: string; // Backend uses customerId
  customer_id?: string; // Legacy support
  customerName: string; // Backend uses customerName
  trainerId: string; // Backend uses trainerId
  trainer_id?: string; // Legacy support
  trainerName: string; // Backend uses trainerName
  attendance?: AttendanceStatus;
  current_session?: number;
  isExtra?: boolean;
  customer_name?: string; // Legacy support
  trainer_name?: string; // Legacy support
  customer_first_name?: string;
  customer_last_name?: string;
  customer_email?: string;
  customer_nic?: string;
  customer_phone?: string;
}

export interface FetchSessionsParams {
  ids?: string[];
  searchTerm?: string;
  isActive?: boolean;
  customer_type?: 'individual' | 'group';
  group_id?: string;
  month?: number;
  year?: number;
  customer_id?: string;
  customerId?: string;
  trainerId?: string;
  isAttended?: boolean;
  page?: number;
  size?: number;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;
}

export interface SessionsResponse {
  status: 'SUCCESS' | 'FAIL';
  message: string | null;
  data: PTSession[];
  total?: number;
}

export interface CreateExtraSessionDto {
  sessionDate: string;
  sessionStart: string;
  sessionStop: string;
  customerId: string;
  packageId: string;
}

export interface CreateSessionDto {
  customerId: string; // Backend requires customerId
  customerName: string; // Backend requires customerName
  trainerId: string; // Backend requires trainerId
  trainerName: string; // Backend requires trainerName
  // Legacy fields for backward compatibility
  sessionDate?: string;
  sessionStart?: string;
  sessionStop?: string;
  packageId?: string;
  repeatCount?: number;
  repeatInterval?: number;
}

export interface FindCustomerSessionsDto {
  customerNIC?: string;
  customerName?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}

export interface TrainerQueryParams {
  trainerNIC?: string;
  trainerName?: string;
  startDate?: string;
  endDate?: string;
}

export interface SessionSummary {
  currentMonth: string;
  startDate: string;
  today: string;
  currentSession: string;
  clientName: string;
  paymentStatus: "paid" | "unpaid";
  extraSessionCount: string;
  extraAmountPaid: string;
}

export interface GroupSessionHistoryProps {
  groupId: string;
}


