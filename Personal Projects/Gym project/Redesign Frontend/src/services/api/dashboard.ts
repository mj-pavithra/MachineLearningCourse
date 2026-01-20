import axiosInstance from './client';
import { DashboardData, DashboardKpi, DashboardEarningsPoint, RecentPayment, AttendanceSummary, ActivityItem, PaymentHistoryObject } from '@/types/dashboard';
import { ApiResponse, ApiError, validateApiResponse, createApiErrorFromAxiosError } from './types';
import { getGymIdFromToken } from '@/utils/jwt';
import { STORAGE_KEYS } from '@/utils/constants';
import { fetchClientPayments } from './finances';
import { getDailyAttendance, DailyAttendanceItem } from './attendance';
import { Payment, DocumentStatus } from '@/types/finance';
import { format, startOfDay } from 'date-fns';
import { fetchCustomersList } from './customers';
import { fetchPackages } from './packages';
import { Customer, IndividualCustomer } from '@/types/customer';

/**
 * Dashboard API service
 * 
 * @module DashboardAPI
 */

/**
 * Fetches dashboard data including statistics for customers, trainers, payments, etc.
 * 
 * @endpoint GET /admin/admin-management/dashboard
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * @requires Admin Yes (admin-only endpoint)
 * 
 * @returns {Promise<DashboardData>} Dashboard data including:
 *   - client statistics (individual, group, pendingPayments)
 *   - trainer statistics (partTime, fullTime)
 *   - payment history
 * 
 * @throws {ApiError} If response status is not SUCCESS or HTTP error occurs
 * 
 * @example
 * ```typescript
 * const data = await fetchDashboard();
 * console.log(data.client.individual); // number of individual customers
 * ```
 */
export async function fetchDashboard(): Promise<DashboardData> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const response = await axiosInstance.get<ApiResponse<DashboardData>>('/admin/admin-management/dashboard');

    return validateApiResponse(response.data, '/admin/admin-management/dashboard', 'GET', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    // Handle non-Axios errors
    throw new ApiError(
      error?.message || 'Failed to fetch dashboard data',
      500,
      { url: '/admin/admin-management/dashboard', method: 'GET', gymId }
    );
  }
}

/**
 * Transform dashboard data to KPI array
 */
export function transformToKpis(data: DashboardData): DashboardKpi[] {
  const totalCustomers = data.client ? data.client.individual + data.client.group : 0;
  const totalTrainers = data.trainer ? data.trainer.partTime + data.trainer.fullTime : 0;
  
  // Calculate total revenue from payment history object
  let totalRevenue = 0;
  if (data.paymentHistory) {
    const months = Object.values(data.paymentHistory);
    totalRevenue = months.reduce((sum, month) => sum + (month?.amount || 0), 0);
  }
  
  return [
    {
      id: 'customers',
      title: 'Total Customers',
      value: totalCustomers,
      description: `${data.client?.individual || 0} Individual, ${data.client?.group || 0} Group`,
    },
    {
      id: 'trainers',
      title: 'Total Trainers',
      value: totalTrainers,
      description: `${data.trainer?.partTime || 0} Part-time, ${data.trainer?.fullTime || 0} Full-time`,
    },
    {
      id: 'pending-payments',
      title: 'Pending Payments',
      value: data.client?.pendingPayments || 0,
      description: 'Unpaid invoices',
    },
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: totalRevenue,
      description: 'All time',
    },
  ];
}

/**
 * Transform payment history object (month01-month08) to earnings points array
 * Filters out months with empty month names or zero amounts
 */
export function transformToEarningsPoints(
  paymentHistory: { [key: string]: { month: string; amount: number } } | PaymentHistoryObject | undefined
): DashboardEarningsPoint[] {
  if (!paymentHistory) return [];
  
  // Convert object to array and filter out invalid entries
  return Object.values(paymentHistory)
    .filter((item) => item.month && item.month.trim() !== '' && item.amount > 0)
    .map((item) => ({
      date: item.month,
      amount: item.amount,
    }))
    .sort((a, b) => {
      // Sort by month name if possible, otherwise by amount
      const monthOrder = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const aIndex = monthOrder.indexOf(a.date);
      const bIndex = monthOrder.indexOf(b.date);
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      return a.date.localeCompare(b.date);
    });
}

/**
 * Fetch recent payments for dashboard
 */
export async function fetchRecentPayments(params?: {
  page?: number;
  size?: number;
  startDate?: string;
  endDate?: string;
}): Promise<{ items: RecentPayment[]; total: number; page?: number; size?: number }> {
  try {
    const paymentsResponse = await fetchClientPayments({
      page: params?.page || 1,
      size: params?.size || 10,
      startDate: params?.startDate,
      endDate: params?.endDate,
    });

    // Get unique customer IDs from payments
    const customerIds = [...new Set(paymentsResponse.items.map((p: Payment) => p.paidFor).filter(Boolean))];
    
    // Fetch customers and packages in parallel for efficient lookup
    const [customersResponse, packages] = await Promise.all([
      customerIds.length > 0 
        ? fetchCustomersList({ size: 1000 }) // Fetch enough to cover all customers
        : Promise.resolve({ customers: [], total: 0 }),
      fetchPackages().catch(() => []), // Handle errors gracefully
    ]);

    // Create lookup maps for efficient access
    const customerMap = new Map<string, string>();
    const packageMap = new Map<string, string>();

    // Build customer name map
    const allCustomers = customersResponse.customers || [];
    allCustomers.forEach((customer: Customer | IndividualCustomer) => {
      const customerId = customer.clientId;
      let customerName = '';
      
      // Handle IndividualCustomer (has firstName/lastName)
      if ('firstName' in customer && 'lastName' in customer) {
        customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
      } 
      // Handle Customer (has name)
      else if ('name' in customer) {
        customerName = customer.name || '';
      }
      
      if (customerId && customerName) {
        customerMap.set(customerId, customerName);
      }
    });

    // Build package name map
    packages.forEach((pkg) => {
      const packageId = pkg._id || pkg.packageId || '';
      const packageName = pkg.name || pkg.package_name || '';
      if (packageId && packageName) {
        packageMap.set(packageId, packageName);
      }
    });

    // Helper function to get customer name
    const getCustomerName = (customerId: string, fallbackName?: string): string => {
      if (!customerId) return fallbackName || '';
      return customerMap.get(customerId) || fallbackName || customerId;
    };

    // Helper function to get package name from customer
    const getPackageName = (customerId: string, fallbackType?: string): string => {
      if (!customerId) return fallbackType || 'N/A';
      const customer = allCustomers.find((c: Customer | IndividualCustomer) => c.clientId === customerId);
      if (customer && customer.packageId) {
        return packageMap.get(customer.packageId) || customer.package_name || 'N/A';
      }
      return fallbackType || 'N/A';
    };

    // Helper function to map status
    const mapStatus = (status: string | DocumentStatus): 'PAID' | 'PENDING' | 'REFUNDED' | 'FAILED' => {
      if (status === DocumentStatus.ACTIVE || status === 'ACTIVE') {
        return 'PAID';
      }
      if (status === DocumentStatus.INACTIVE || status === 'INACTIVE') {
        return 'PENDING';
      }
      // Legacy support
      if (status === 'PAID') return 'PAID';
      if (status === 'NOT_PAID') return 'PENDING';
      return 'PENDING';
    };

    // Transform Payment[] to RecentPayment[]
    const items: RecentPayment[] = paymentsResponse.items.map((payment: Payment) => {
      const customerId = payment.paidFor || '';
      return {
        id: payment.id || payment.paymentId || payment._id || '',
        date: payment.createdAt || payment.paymentDate || '',
        customerName: getCustomerName(customerId, payment.clientName),
        packageName: getPackageName(customerId, payment.paymentType),
        amount: payment.amount || parseFloat(payment.paidAmount || '0') || 0,
        method: 'CASH', // Payment type doesn't have paymentMethod property
        status: mapStatus(payment.status),
        customerId,
      };
    });

    return {
      items,
      total: paymentsResponse.total,
      page: paymentsResponse.page,
      size: paymentsResponse.size,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch today's attendance summary
 */
export async function fetchTodayAttendance(): Promise<AttendanceSummary> {
  try {
    const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
    const response = await getDailyAttendance({
      startDate: today,
      endDate: today,
    });

    // response.data is DailyAttendanceData[] (array), get first element or use default
    const data = response.data[0] || { attendances: [], totalCount: 0 };
    const registered = data.totalCount || 0;
    const present = data.attendances?.filter((a: DailyAttendanceItem) => a.isAllowed).length || 0;
    const absent = registered - present;
    const presentPercent = registered > 0 ? (present / registered) * 100 : 0;

    return {
      date: today,
      registered,
      present,
      absent,
      presentPercent,
    };
  } catch (error) {
    // Return empty summary on error
    const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
    return {
      date: today,
      registered: 0,
      present: 0,
      absent: 0,
      presentPercent: 0,
    };
  }
}

/**
 * Fetch recent activity (mock implementation - TODO: implement actual activity endpoint)
 */
export async function fetchRecentActivity(_params?: {
  page?: number;
  size?: number;
}): Promise<{ items: ActivityItem[]; total: number; hasMore: boolean }> {
  // TODO: Implement actual activity endpoint when available
  // For now, return empty array
  return {
    items: [],
    total: 0,
    hasMore: false,
  };
}

