/**
 * MSW (Mock Service Worker) handlers for API mocking
 * Used for local development and testing
 * 
 * Enable with: VITE_ENABLE_DEV_MOCKS=true
 */

import { http, HttpResponse } from 'msw';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.payzhe.fit/api/v1';

/**
 * Mock data generators
 */
const mockDashboard = {
  status: 'SUCCESS',
  message: 'Dashboard data retrieved successfully',
  data: {
    client: {
      individual: 45,
      group: 12,
      pendingPayments: 3,
    },
    trainer: {
      partTime: 8,
      fullTime: 5,
    },
    paymentHistory: [
      { date: '2024-01-01', amount: 5000 },
      { date: '2024-01-02', amount: 3200 },
    ],
  },
};

const mockCustomers = {
  status: 'SUCCESS',
  message: 'Customers retrieved successfully',
  data: {
    customers: [
      { _id: '1', name: 'John Doe', email: 'john@example.com', phone: '1234567890' },
      { _id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '0987654321' },
    ],
    total: 2,
    page: 1,
    limit: 10,
  },
};

const mockTrainers = {
  status: 'SUCCESS',
  message: 'Trainers retrieved successfully',
  data: {
    items: [
      { _id: '1', name: 'Trainer One', email: 'trainer1@example.com', type: 'full-time' },
      { _id: '2', name: 'Trainer Two', email: 'trainer2@example.com', type: 'part-time' },
    ],
    total: 2,
    page: 1,
    size: 20,
  },
};

const mockPackages = {
  status: 'SUCCESS',
  message: 'Packages retrieved successfully',
  data: [
    { _id: '1', name: 'Basic Package', price: 1000, duration: 30 },
    { _id: '2', name: 'Premium Package', price: 2000, duration: 60 },
  ],
};

const mockEquipment = {
  status: 'SUCCESS',
  message: 'Equipment retrieved successfully',
  data: {
    items: [
      { _id: '1', name: 'Treadmill', type: 'cardio', status: 'available' },
      { _id: '2', name: 'Dumbbells', type: 'weights', status: 'in-use' },
    ],
    total: 2,
    page: 1,
    size: 20,
  },
};

const mockPayments = {
  status: 'SUCCESS',
  message: 'Payments retrieved successfully',
  data: {
    items: [
      { _id: '1', clientId: '1', amount: 1000, paymentDate: '2024-01-01', status: 'completed' },
    ],
    total: 1,
    page: 1,
    size: 20,
  },
};

const mockSalaries = {
  status: 'SUCCESS',
  message: 'Salaries retrieved successfully',
  data: {
    items: [
      { _id: '1', trainerId: '1', month: 1, year: 2024, amount: 5000, status: 'pending' },
    ],
    total: 1,
    page: 1,
    size: 20,
  },
};

const mockSessions = {
  status: 'SUCCESS',
  message: 'Sessions retrieved successfully',
  data: {
    items: [
      { _id: '1', trainerId: '1', clientId: '1', date: '2024-01-01T10:00:00Z', attendance: 'attended' },
    ],
    total: 1,
    page: 1,
    size: 20,
  },
};

/**
 * MSW handlers
 */
export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/admin/admin-management/login`, () => {
    return HttpResponse.json({
      status: 'SUCCESS',
      message: 'Login successful',
      data: {
        idToken: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        user: {
          _id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
      },
    });
  }),

  http.post(`${API_BASE_URL}/admin/admin-management/refresh-token`, () => {
    return HttpResponse.json({
      status: 'SUCCESS',
      message: 'Token refreshed successfully',
      data: {
        idToken: 'new-mock-jwt-token',
        refreshToken: 'new-mock-refresh-token',
      },
    });
  }),

  http.post(`${API_BASE_URL}/admin/admin-management/forgot-password`, () => {
    return HttpResponse.json({
      status: 'SUCCESS',
      message: 'Password reset email sent',
      data: null,
    });
  }),

  // Dashboard
  http.get(`${API_BASE_URL}/dashboard`, () => {
    return HttpResponse.json(mockDashboard);
  }),

  // Customers
  http.get(`${API_BASE_URL}/customers`, () => {
    return HttpResponse.json(mockCustomers);
  }),

  http.get(`${API_BASE_URL}/customers/individual`, () => {
    return HttpResponse.json({
      status: 'SUCCESS',
      message: 'Individual customers retrieved',
      data: mockCustomers.data.customers,
    });
  }),

  http.get(`${API_BASE_URL}/customers/group`, () => {
    return HttpResponse.json({
      status: 'SUCCESS',
      message: 'Group customers retrieved',
      data: [],
    });
  }),

  http.post(`${API_BASE_URL}/customers`, () => {
    return HttpResponse.json({
      status: 'SUCCESS',
      message: 'Customer created successfully',
      data: { _id: '3', name: 'New Customer', email: 'new@example.com' },
    });
  }),

  // Trainers
  http.get(`${API_BASE_URL}/admin/admin-management/getAllMembers`, () => {
    return HttpResponse.json(mockTrainers);
  }),

  http.get(`${API_BASE_URL}/admin/admin-management/:id`, () => {
    return HttpResponse.json({
      status: 'SUCCESS',
      message: 'Trainer retrieved successfully',
      data: mockTrainers.data.items[0],
    });
  }),

  // Packages
  http.get(`${API_BASE_URL}/packages/get-all`, () => {
    return HttpResponse.json({
      status: 'SUCCESS',
      message: 'Packages retrieved successfully',
      data: mockPackages.data,
    });
  }),

  // Equipment
  http.get(`${API_BASE_URL}/equipments`, () => {
    return HttpResponse.json(mockEquipment);
  }),

  // Finances
  http.get(`${API_BASE_URL}/finances/client-payments`, () => {
    return HttpResponse.json(mockPayments);
  }),

  http.get(`${API_BASE_URL}/finances/trainer-salaries`, () => {
    return HttpResponse.json(mockSalaries);
  }),

  // Sessions
  http.get(`${API_BASE_URL}/sessions`, () => {
    return HttpResponse.json(mockSessions);
  }),

  // Default catch-all for unhandled requests
  http.all('*', ({ request }) => {
    console.warn(`[MSW] Unhandled request: ${request.method} ${request.url}`);
    return HttpResponse.json(
      {
        status: 'FAIL',
        message: 'Mock endpoint not implemented',
        data: null,
      },
      { status: 404 }
    );
  }),
];

