/**
 * Monthly payment data structure
 */
export interface MonthlyPayment {
  month: string;
  amount: number;
}

/**
 * Payment history object structure from API
 */
export interface PaymentHistoryObject {
  month01: MonthlyPayment;
  month02: MonthlyPayment;
  month03: MonthlyPayment;
  month04: MonthlyPayment;
  month05: MonthlyPayment;
  month06: MonthlyPayment;
  month07: MonthlyPayment;
  month08: MonthlyPayment;
}

export type DashboardData = {
  trainer: {
    partTime: number;
    fullTime: number;
  };
  client: {
    group: number;
    individual: number;
    pendingPayments: number;
  };
  paymentHistory: PaymentHistoryObject;
};

/**
 * KPI Card data structure
 */
export interface DashboardKpi {
  id: string;
  title: string;
  value: number;
  changePercent?: number;
  description?: string;
  icon?: React.ReactElement;
}

/**
 * Earnings chart data point
 */
export interface DashboardEarningsPoint {
  date: string; // ISO date string
  amount: number;
}

/**
 * Recent payment record
 */
export interface RecentPayment {
  id: string;
  date: string | null | undefined; // ISO date string (can be null/undefined from API)
  customerName: string;
  packageName: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'ONLINE' | 'BANK_TRANSFER';
  status: 'PAID' | 'PENDING' | 'REFUNDED' | 'FAILED';
  customerId?: string;
  packageId?: string;
}

/**
 * Today's attendance summary
 */
export interface AttendanceSummary {
  date: string; // ISO date string
  registered: number; // Total registered clients
  present: number; // Clients who attended
  absent: number; // Clients who didn't attend
  presentPercent: number; // Percentage present (0-100)
}

/**
 * Activity feed item
 */
export interface ActivityItem {
  id: string;
  type: 'login' | 'payment' | 'session_created' | 'customer_created' | 'attendance_marked' | 'package_created';
  title: string;
  description?: string;
  timestamp: string; // ISO date string
  userId?: string;
  userName?: string;
  resourceId?: string; // ID of related resource (customer, payment, etc.)
  resourceType?: string; // Type of related resource
  link?: string; // Optional link to resource
}

/**
 * Date range for filtering
 */
export interface DateRange {
  from: string; // ISO date string
  to: string; // ISO date string
}

/**
 * Dashboard filter parameters
 */
export interface DashboardFilters {
  dateRange?: DateRange;
  trainerId?: string;
  packageId?: string;
  search?: string;
}

/**
 * Predefined date range options
 */
export type DateRangePreset = '7d' | '30d' | '90d' | 'custom';


