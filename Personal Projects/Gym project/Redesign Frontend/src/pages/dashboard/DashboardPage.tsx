import { useEffect, useState, useMemo, useCallback } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { SimpleGrid, Box } from '@chakra-ui/react';
import { HiUsers, HiUserGroup, HiCurrencyDollar, HiClock } from 'react-icons/hi';
import { format, subDays } from 'date-fns';

import { fetchDashboard, transformToKpis, transformToEarningsPoints, fetchRecentPayments, fetchTodayAttendance, fetchRecentActivity } from '@/services/api/dashboard';
import { queryKeys } from '@/services/api/queryKeys';
import { fetchTrainers } from '@/services/api/trainers';
import { fetchPackages } from '@/services/api/packages';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/utils/toast';
import * as prefetchers from '@/routes/prefetchers';
import { DashboardFilters as DashboardFiltersType } from '@/types/dashboard';

// Import new dashboard components
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DashboardEmpty } from '@/components/dashboard/DashboardEmpty';
import { KpiGrid } from '@/components/dashboard/KpiGrid';
import { EarningsChartCard } from '@/components/dashboard/EarningsChartCard';
import { PaymentsTableCard } from '@/components/dashboard/PaymentsTableCard';
import { AttendanceCard } from '@/components/dashboard/AttendanceCard';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { TrainerStatsCard } from '@/components/dashboard/TrainerStatsCard';
import { ClientStatsCard } from '@/components/dashboard/ClientStatsCard';

export default function DashboardPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();

  // Filter state
  const [filters, setFilters] = useState<DashboardFiltersType>({});
  const [, setDateRange] = useState<{ from: string; to: string }>(() => {
    const today = new Date();
    return {
      from: format(subDays(today, 30), 'yyyy-MM-dd'),
      to: format(today, 'yyyy-MM-dd'),
    };
  });

  // Main dashboard data
  const { data: dashboardData, isLoading: isLoadingDashboard, error: dashboardError } = useQuery({
    queryKey: queryKeys.dashboard.all,
    queryFn: fetchDashboard,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // KPIs (derived from dashboard data)
  const kpis = useMemo(() => {
    if (!dashboardData) return [];
    return transformToKpis(dashboardData).map((kpi) => ({
      ...kpi,
      icon: getKpiIcon(kpi.id),
    }));
  }, [dashboardData]);

  // Earnings data
  const earningsData = useMemo(() => {
    if (!dashboardData?.paymentHistory) return [];
    return transformToEarningsPoints(dashboardData.paymentHistory);
  }, [dashboardData]);

  // Recent payments
  const { data: paymentsData, isLoading: isLoadingPayments, refetch: refetchPayments } = useQuery({
    queryKey: queryKeys.dashboard.payments({ page: 1, size: 10, filters }),
    queryFn: () => fetchRecentPayments({
      page: 1,
      size: 10,
      startDate: filters.dateRange?.from,
      endDate: filters.dateRange?.to,
    }),
    staleTime: 1000 * 60, // 1 minute
    enabled: true,
  });

  // Today's attendance
  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: queryKeys.dashboard.attendance(format(new Date(), 'yyyy-MM-dd')),
    queryFn: fetchTodayAttendance,
    staleTime: 1000 * 60, // 1 minute
  });

  // Recent activity
  const { data: activityData, isLoading: isLoadingActivity } = useQuery({
    queryKey: queryKeys.dashboard.activity({ page: 1, size: 10 }),
    queryFn: () => fetchRecentActivity({ page: 1, size: 10 }),
    staleTime: 1000 * 60, // 1 minute
  });

  // Trainers and packages for filters
  const { data: trainersData } = useQuery({
    queryKey: queryKeys.trainers.list({ page: 1, size: 100 }),
    queryFn: () => fetchTrainers({ page: 1, size: 100 }),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const { data: packagesData } = useQuery({
    queryKey: queryKeys.packages.list(),
    queryFn: fetchPackages,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Transform trainers and packages for filter dropdowns
  const trainers = useMemo(() => {
    return trainersData?.items?.map((t) => ({ 
      id: t._id || '', 
      name: `${t.firstName || ''} ${t.lastName || ''}`.trim() || 'Unnamed Trainer' 
    })) || [];
  }, [trainersData]);

  const packages = useMemo(() => {
    return packagesData?.map((p) => ({ 
      id: p._id || p.packageId || '', 
      name: p.name || p.package_name || 'Unnamed Package' 
    })) || [];
  }, [packagesData]);

  useEffect(() => {
    document.title = 'Dashboard • PayZhe';
    prefetchers.prefetchDashboard(qc);
  }, [qc]);

  const showErrorToast = useCallback(
    (errorMessage: string) => {
      toast.create({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
    [toast]
  );

  useEffect(() => {
    if (dashboardError) {
      showErrorToast(getErrorMessage(dashboardError));
    }
  }, [dashboardError, showErrorToast]);

  const handleDateRangeChange = useCallback((range: { from: string; to: string }) => {
    setDateRange(range);
    setFilters((prev) => ({ ...prev, dateRange: range }));
  }, []);

  const handleFiltersChange = useCallback((newFilters: DashboardFiltersType | ((prev: DashboardFiltersType) => DashboardFiltersType)) => {
    setFilters((prevFilters) => {
      const updatedFilters = typeof newFilters === 'function' ? newFilters(prevFilters) : newFilters;
      if (updatedFilters.dateRange) {
        setDateRange(updatedFilters.dateRange);
      }
      return updatedFilters;
    });
  }, []);

  const handleViewPayment = useCallback((payment: any) => {
    navigate(`/finances/client-payments?paymentId=${payment.id}`);
  }, [navigate]);


  const handleCollectPayment = useCallback(() => {
    navigate('/finances/client-payments?action=create');
  }, [navigate]);

  const handleMarkAttendance = useCallback(() => {
    navigate('/sessions?action=mark-attendance');
  }, [navigate]);

  const isLoading = isLoadingDashboard || isLoadingPayments || isLoadingAttendance || isLoadingActivity;

  // Show skeleton while loading
  if (isLoading && !dashboardData) {
    return <DashboardSkeleton />;
  }

  // Show empty state if no data
  if (!isLoading && !dashboardData) {
    return (
      <DashboardShell title="Dashboard">
        <DashboardEmpty
          title="No Dashboard Data"
          description="Unable to load dashboard data. Please try refreshing the page."
          actionLabel="Refresh"
          onAction={() => window.location.reload()}
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Dashboard"
      lastUpdated={new Date()}
      quickActions={
        <QuickActions
          onCollectPayment={handleCollectPayment}
          onMarkAttendance={handleMarkAttendance}
          onAddCustomer={() => navigate('/customers?action=create')}
          onNewPackage={() => navigate('/packages?action=create')}
        />
      }
      filters={
        <DashboardFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          trainers={trainers}
          packages={packages}
          loading={isLoading}
        />
      }
    >
      {/* KPI Grid */}
      <KpiGrid
        kpis={kpis}
        loading={isLoadingDashboard}
        onKpiClick={(kpiId) => {
          // Navigate based on KPI clicked
          if (kpiId === 'customers') navigate('/customers');
          else if (kpiId === 'trainers') navigate('/trainers');
          else if (kpiId === 'pending-payments') navigate('/finances/client-payments?status=PENDING');
        }}
      />

      {/* Trainer and Client Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: 4, md: 5, lg: 6 }} mt={{ base: 4, md: 5, lg: 6 }}>
        <TrainerStatsCard
          partTime={dashboardData?.trainer?.partTime || 0}
          fullTime={dashboardData?.trainer?.fullTime || 0}
          loading={isLoadingDashboard}
          onClick={() => navigate('/trainers')}
        />
        <ClientStatsCard
          individual={dashboardData?.client?.individual || 0}
          group={dashboardData?.client?.group || 0}
          pendingPayments={dashboardData?.client?.pendingPayments || 0}
          loading={isLoadingDashboard}
          onClick={() => navigate('/customers')}
        />
      </SimpleGrid>

      {/* Payment History Chart - Full Width */}
      <Box mt={{ base: 4, md: 5, lg: 6 }}>
        <EarningsChartCard
          data={earningsData}
          loading={isLoadingDashboard}
          onRangeChange={handleDateRangeChange}
        />
      </Box>

      {/* Bottom Row - Payments Table and Attendance */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} gap={{ base: 4, md: 5, lg: 6 }} mt={{ base: 4, md: 5, lg: 6 }}>
        {/* Payments Table - Takes 2 columns on desktop */}
        <Box gridColumn={{ base: '1', lg: 'span 2' }}>
          <PaymentsTableCard
            data={paymentsData?.items || []}
            loading={isLoadingPayments}
            total={paymentsData?.total || 0}
            page={paymentsData?.page || 1}
            size={paymentsData?.size || 10}
            onRefresh={() => refetchPayments()}
            onViewPayment={handleViewPayment}
          />
        </Box>

        {/* Right column - Attendance and Activity */}
        <Box>
          <SimpleGrid columns={1} gap={{ base: 4, md: 5, lg: 6 }}>
            {/* Attendance Card */}
            <AttendanceCard
              data={attendanceData}
              loading={isLoadingAttendance}
              onMarkAttendance={handleMarkAttendance}
            />

            {/* Recent Activity */}
            <RecentActivityCard
              data={activityData?.items || []}
              loading={isLoadingActivity}
              hasMore={activityData?.hasMore || false}
            />
          </SimpleGrid>
        </Box>
      </SimpleGrid>
    </DashboardShell>
  );
}

/**
 * Get icon for KPI
 */
function getKpiIcon(kpiId: string) {
  switch (kpiId) {
    case 'customers':
      return <HiUsers />;
    case 'trainers':
      return <HiUserGroup />;
    case 'pending-payments':
      return <HiClock />;
    case 'revenue':
      return <HiCurrencyDollar />;
    default:
      return undefined;
  }
}
