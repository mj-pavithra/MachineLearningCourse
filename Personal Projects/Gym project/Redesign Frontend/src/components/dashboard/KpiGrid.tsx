import { SimpleGrid } from '@chakra-ui/react';
import { KpiCard } from './KpiCard';
import { DashboardKpi } from '@/types/dashboard';

export interface KpiGridProps {
  kpis: DashboardKpi[];
  loading?: boolean;
  onKpiClick?: (kpiId: string) => void;
  variant?: 'default' | 'compact';
}

/**
 * Responsive grid of KPI cards
 * 
 * @example
 * ```tsx
 * <KpiGrid
 *   kpis={[
 *     { id: '1', title: 'Customers', value: 150, changePercent: 5.2 },
 *     { id: '2', title: 'Revenue', value: 50000, changePercent: -2.1 },
 *   ]}
 * />
 * ```
 */
export function KpiGrid({ kpis, loading = false, onKpiClick, variant = 'default' }: KpiGridProps) {
  if (loading && kpis.length === 0) {
    // Show skeleton cards
    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={{ base: 4, md: 5, lg: 6 }}>
        {[1, 2, 3, 4].map((i) => (
          <KpiCard key={i} title="" value={0} loading={true} variant={variant} />
        ))}
      </SimpleGrid>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
      {kpis.map((kpi) => (
        <KpiCard
          key={kpi.id}
          id={kpi.id}
          title={kpi.title}
          value={kpi.value}
          change={kpi.changePercent}
          description={kpi.description}
          icon={kpi.icon}
          onClick={onKpiClick ? () => onKpiClick(kpi.id) : undefined}
          loading={loading}
          variant={variant}
        />
      ))}
    </SimpleGrid>
  );
}



