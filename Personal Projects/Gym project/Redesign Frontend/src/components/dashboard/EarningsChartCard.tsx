import { useState, lazy, Suspense, useMemo } from 'react';
import { Card, Box, HStack, VStack, Skeleton, Text, NativeSelect } from '@chakra-ui/react';
import { ModernButton } from '@/components/ui/ModernButton';
import { HiDownload } from 'react-icons/hi';
import { DashboardEarningsPoint, DateRangePreset } from '@/types/dashboard';
import { formatCurrency, formatDate } from './utils/formatters';
import { subDays, format } from 'date-fns';
import { exportToCSV } from '@/utils/export';

// Lazy load chart component to avoid SSR issues
const EarningsChart = lazy(() => import('@/components/charts/EarningsChart').then(m => ({ default: m.EarningsChart })));

export interface EarningsChartCardProps {
  data: DashboardEarningsPoint[];
  loading?: boolean;
  onRangeChange?: (range: { from: string; to: string }) => void;
}

/**
 * Earnings chart card with date range selector and export functionality
 * 
 * @example
 * ```tsx
 * <EarningsChartCard
 *   data={earningsData}
 *   loading={isLoading}
 *   onRangeChange={(range) => setDateRange(range)}
 * />
 * ```
 */
export function EarningsChartCard({ data, loading = false, onRangeChange }: EarningsChartCardProps) {
  const [selectedRange, setSelectedRange] = useState<DateRangePreset>('30d');

  // Calculate date range based on preset
  const getDateRange = (preset: DateRangePreset): { from: string; to: string } => {
    const today = new Date();
    const to = format(today, 'yyyy-MM-dd');
    
    switch (preset) {
      case '7d':
        return { from: format(subDays(today, 7), 'yyyy-MM-dd'), to };
      case '30d':
        return { from: format(subDays(today, 30), 'yyyy-MM-dd'), to };
      case '90d':
        return { from: format(subDays(today, 90), 'yyyy-MM-dd'), to };
      default:
        return { from: format(subDays(today, 30), 'yyyy-MM-dd'), to };
    }
  };

  const handleRangeChange = (preset: DateRangePreset) => {
    setSelectedRange(preset);
    if (preset !== 'custom' && onRangeChange) {
      onRangeChange(getDateRange(preset));
    }
  };

  // Transform data for chart (month names are already in the data)
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((point) => ({
      month: point.date, // Already contains month name like "August", "September"
      amount: point.amount,
    }));
  }, [data]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (!data || data.length === 0) {
      return { total: 0, average: 0, count: 0 };
    }
    const total = data.reduce((sum, point) => sum + point.amount, 0);
    const count = data.length;
    const average = count > 0 ? total / count : 0;
    return { total, average, count };
  }, [data]);

  const handleExportCSV = () => {
    if (!data || data.length === 0) return;
    
    const csvData = data.map((point) => ({
      Date: formatDate(point.date),
      Amount: point.amount,
    }));
    
    exportToCSV(csvData, `earnings-${selectedRange}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export when exportToPDF is available
    console.warn('PDF export not yet implemented');
  };

  return (
    <Card.Root>
      <Card.Body p={{ base: 3, md: 4, lg: 5 }}>
        <VStack align="stretch" gap={{ base: 3, md: 4 }}>
          {/* Header with title and controls */}
          <HStack justify="space-between" align="center" flexWrap={{ base: 'wrap', md: 'nowrap' }}>
            <Text fontSize="lg" fontWeight="semibold" color="gray.900">
              Earnings Overview
            </Text>
            <HStack gap={2} flexWrap={{ base: 'wrap', sm: 'nowrap' }}>
              {/* Date range selector */}
              <NativeSelect.Root
                size="sm"
                width={{ base: 'full', sm: '150px' }}
              >
                <NativeSelect.Field
                  value={selectedRange}
                  onChange={(e) => handleRangeChange(e.target.value as DateRangePreset)}
                  aria-label="Date range selector"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="custom">Custom range</option>
                </NativeSelect.Field>
              </NativeSelect.Root>

              {/* Export buttons */}
              <HStack gap={2}>
                <ModernButton
                  size="sm"
                  variant="outline"
                  onClick={handleExportCSV}
                  disabled={loading || !data || data.length === 0}
                >
                  <HiDownload />
                  CSV
                </ModernButton>
                <ModernButton
                  size="sm"
                  variant="outline"
                  onClick={handleExportPDF}
                  disabled={loading || !data || data.length === 0}
                >
                  <HiDownload />
                  PDF
                </ModernButton>
              </HStack>
            </HStack>
          </HStack>

          {/* Summary stats */}
          {!loading && data && data.length > 0 && (
            <HStack gap={4} flexWrap="wrap" fontSize="sm" color="gray.600">
              <Text>
                <Text as="span" fontWeight="semibold" color="gray.900">
                  Total:
                </Text>{' '}
                {formatCurrency(summaryStats.total)}
              </Text>
              <Text>
                <Text as="span" fontWeight="semibold" color="gray.900">
                  Average:
                </Text>{' '}
                {formatCurrency(summaryStats.average)}
              </Text>
              <Text>
                <Text as="span" fontWeight="semibold" color="gray.900">
                  Data Points:
                </Text>{' '}
                {summaryStats.count}
              </Text>
            </HStack>
          )}

          {/* Chart */}
          <Box minH="300px" position="relative">
            {loading ? (
              <Skeleton height="300px" width="100%" />
            ) : (
              <Suspense fallback={<Skeleton height="300px" width="100%" />}>
                <EarningsChart
                  data={chartData}
                  isLoading={false}
                  height={300}
                  variant="area"
                />
              </Suspense>
            )}
            {/* Accessible description for screen readers */}
            <Box
              position="absolute"
              left="-10000px"
              width="1px"
              height="1px"
              overflow="hidden"
              aria-live="polite"
            >
              Earnings chart showing {summaryStats.count} data points from{' '}
              {selectedRange === 'custom' ? 'custom range' : `last ${selectedRange}`}. Total earnings:{' '}
              {formatCurrency(summaryStats.total)}. Average daily earnings:{' '}
              {formatCurrency(summaryStats.average)}.
            </Box>
          </Box>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

