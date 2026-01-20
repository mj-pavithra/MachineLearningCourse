import React, { Suspense } from 'react';
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AuthLayout from '@/layouts/AuthLayout';
import AppLayout from '@/layouts/AppLayout';
import RouteSkeleton from '@/components/common/RouteSkeleton';

// Lazy load all pages for code splitting
const SignInPage = React.lazy(() => import('@/pages/auth/SignInPage'));
const ResetPasswordPage = React.lazy(() => import('@/pages/auth/ResetPasswordPage'));
const NewPasswordPage = React.lazy(() => import('@/pages/auth/NewPasswordPage'));

const DashboardPage = React.lazy(() => import('@/pages/dashboard/DashboardPage'));
const CustomersPage = React.lazy(() => import('@/pages/customers/CustomersPage'));
const CustomerProfilePage = React.lazy(() => import('@/pages/customers/CustomerProfilePage'));
const TrainersPage = React.lazy(() => import('@/pages/trainers/TrainersPage'));
const PackagesPage = React.lazy(() => import('@/pages/packages/PackagesPage'));
const EquipmentPage = React.lazy(() => import('@/pages/equipment/EquipmentPage'));

const FinancesPage = React.lazy(() => import('@/pages/finances/FinancesPage'));
const ClientPaymentsPage = React.lazy(() => import('@/pages/finances/ClientPaymentsPage'));
const TrainerSalariesPage = React.lazy(() => import('@/pages/finances/TrainerSalariesPage'));

const SessionsPage = React.lazy(() => import('@/pages/sessions/SessionsPage'));
const AttendancePage = React.lazy(() => import('@/pages/attendance/AttendancePage'));
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage'));

// Create QueryClient instance with global error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default function Router() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<RouteSkeleton />}>
          <Routes>
            {/* Public / Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/new-password/:token" element={<NewPasswordPage />} />
            </Route>

            {/* Protected App routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/customers/profile/:clientId" element={<CustomerProfilePage />} />
              <Route path="/trainers" element={<TrainersPage />} />
              <Route path="/packages" element={<PackagesPage />} />
              <Route path="/equipment" element={<EquipmentPage />} />

              {/* Nested finances routes */}
              <Route path="/finances" element={<FinancesPage />}>
                <Route index element={<Navigate to="client-payments" replace />} />
                <Route path="client-payments" element={<ClientPaymentsPage />} />
                <Route path="trainer-salaries" element={<TrainerSalariesPage />} />
              </Route>

              <Route path="/sessions" element={<SessionsPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
            </Route>

            {/* Fallback 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Note: React Router v6 doesn't have onEnter. Prefetching is handled
// in each page component's useEffect hook (see page implementations).
