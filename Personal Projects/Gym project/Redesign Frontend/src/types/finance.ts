export enum ClientType {
  GROUP = "Group",
  INDIVIDUAL = "Individual",
  EXTRA_PAYMENT = "Extra Payment"
}

export enum PaymentStatus {
  PAID = "PAID",
  NOT_PAID = "NOT_PAID",
}

export enum DocumentStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ARCHIVED = "ARCHIVED",
  DELETED = "DELETED",
  CANCELED = "CANCELED",
}

export interface Payment {
  _id?: string;
  paymentId: string;
  paidFor: string; // Customer ID
  paidBy?: string; // Payer ID (optional)
  status: DocumentStatus | string;
  amount: number;
  sessionQuota?: number;
  month: string;
  isExtra: boolean;
  reference: string;
  accessgiven: boolean;
  createdAt: string;
  updatedAt: string;
  // Legacy fields for backward compatibility
  id?: string;
  paymentDate?: string;
  clientName?: string;
  paidAmount?: string;
  clientType?: string;
  paymentType?: string;
}

export interface TrainerSalary {
  id: number;
  date: string;
  trainerName: string;
  currentSession: string;
  totalSalary: string;
  type: string;
  status: string;
}

export interface CreatePaymentDto {
  paidFor: string; // Customer ID (required)
  amount?: number; // Amount paid (optional)
  month: string; // Paid for which month (required)
  reference: string; // Short description (required)
  paidBy?: string; // Payer ID (optional)
}

export interface CreateExtraPaymentDto {
  paidFor: string; // Customer ID (required)
  amount?: number; // Amount paid (optional)
  sessionQuota: number; // Number of sessions purchased (required)
}

export interface CreateGroupPaymentDto {
  paidFor: string[]; // Array of customer IDs (required)
  paidBy: string; // Payer ID (required)
  amount?: number; // Amount paid (optional)
  month: string; // Paid for which month (required)
  reference: string; // Reference for the payment (required)
  packageId: string; // Package ID (required)
}


