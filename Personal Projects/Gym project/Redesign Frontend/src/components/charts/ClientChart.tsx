import { Box, Skeleton, Text, useBreakpointValue } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useMemo } from 'react';

interface ClientChartProps {
  individual: number;
  group: number;
  pendingPayments: number;
  isLoading?: boolean;
  height?: number;
}

/**
 * Client statistics bar chart component
 * Shows breakdown of individual vs group clients and pending payments
 * 
 * @example
 * ```tsx
 * <ClientChart individual={100} group={20} pendingPayments={15} />
 * ```
 */
export function ClientChart({ individual, group, pendingPayments, isLoading = false, height = 250 }: ClientChartProps) {
  const total = individual + group;
  
  // Responsive chart sizing
  const chartHeight = useBreakpointValue({ base: 200, md: 250 }) || height;
  const marginRight = useBreakpointValue({ base: 10, md: 30 }) || 30;
  const marginLeft = useBreakpointValue({ base: 0, md: 20 }) || 20;
  const fontSize = useBreakpointValue({ base: '10px', md: '12px' }) || '12px';
  const chartMargin = useMemo(() => ({
    top: 20,
    right: marginRight,
    left: marginLeft,
    bottom: 5,
  }), [marginRight, marginLeft]);

  if (isLoading) {
    return (
      <Box p={{ base: 2, md: 4 }} width="100%">
        <Skeleton height={`${chartHeight}px`} />
      </Box>
    );
  }

  if (total === 0 && pendingPayments === 0) {
    return (
      <Box p={{ base: 2, md: 4 }} textAlign="center" height={`${chartHeight}px`} display="flex" alignItems="center" justifyContent="center">
        <Text color="gray.500" fontSize={{ base: 'xs', md: 'sm' }}>No client data available</Text>
      </Box>
    );
  }

  const data = [
    {
      name: 'Individual',
      value: individual,
      color: '#3182ce',
    },
    {
      name: 'Group',
      value: group,
      color: '#38a169',
    },
    {
      name: 'Pending',
      value: pendingPayments,
      color: '#d69e2e',
    },
  ].filter((item) => item.value > 0); // Only show bars with values > 0

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          p={2}
          boxShadow="md"
        >
          <Text fontSize="sm" fontWeight="semibold" color="gray.900">
            {data.payload.name}
          </Text>
          <Text fontSize="sm" color="gray.600">
            Count: {data.value}
          </Text>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box width="100%" height={`${chartHeight}px`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={chartMargin}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            stroke="#718096"
            style={{ fontSize }}
            tick={{ fill: '#718096' }}
          />
          <YAxis
            stroke="#718096"
            style={{ fontSize }}
            tick={{ fill: '#718096' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span style={{ color: '#718096', fontSize }}>{value}</span>
            )}
          />
          <Bar
            dataKey="value"
            radius={[8, 8, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

