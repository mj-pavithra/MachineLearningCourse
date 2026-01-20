import { Box, Skeleton, Text, useBreakpointValue } from '@chakra-ui/react';
import { LineChart, AreaChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

interface EarningsChartProps {
  data: Array<{ month: string; amount: number }>;
  isLoading?: boolean;
  height?: number;
  variant?: 'line' | 'area';
}

export function EarningsChart({ data, isLoading = false, height = 300, variant = 'area' }: EarningsChartProps) {
  const textColor = '#718096';
  const gridColor = '#e2e8f0';
  
  // Use Chakra UI breakpoint values for responsive design
  const fontSize = useBreakpointValue({ base: '10px', md: '12px' }) || '12px';
  const marginRight = useBreakpointValue({ base: 10, md: 30 }) || 30;
  const marginLeft = useBreakpointValue({ base: 0, md: 20 }) || 20;
  const dotRadius = useBreakpointValue({ base: 3, md: 4 }) || 4;
  const activeDotRadius = useBreakpointValue({ base: 5, md: 6 }) || 6;

  const chartMargin = useMemo(() => ({
    top: 10,
    right: marginRight,
    left: marginLeft,
    bottom: 5,
  }), [marginRight, marginLeft]);

  if (isLoading) {
    return (
      <Box p={{ base: 2, md: 4 }} width="100%">
        <Skeleton height={`${height}px`} />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box p={{ base: 2, md: 4 }} textAlign="center" height={`${height}px`} display="flex" alignItems="center" justifyContent="center">
        <Text color={textColor} fontSize={{ base: 'sm', md: 'md' }}>No payment history available</Text>
      </Box>
    );
  }

  // Format data for chart
  const chartData = useMemo(() => data.map((item) => ({
    month: item.month,
    amount: item.amount,
  })), [data]);

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
            {data.payload.month}
          </Text>
          <Text fontSize="sm" color="gray.600">
            Amount: ${data.value.toLocaleString()}
          </Text>
        </Box>
      );
    }
    return null;
  };

  if (variant === 'area') {
    return (
      <Box p={{ base: 2, md: 4 }} width="100%">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData} margin={chartMargin}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3182ce" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3182ce" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="month"
              stroke={textColor}
              style={{ fontSize }}
              tick={{ fill: textColor }}
            />
            <YAxis
              stroke={textColor}
              style={{ fontSize }}
              tick={{ fill: textColor }}
              tickFormatter={(value) => {
                if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
                return `$${value}`;
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span style={{ color: textColor, fontSize }}>{value}</span>
              )}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#3182ce"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorAmount)"
              name="Earnings"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    );
  }

  return (
    <Box p={{ base: 2, md: 4 }} width="100%">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="month"
            stroke={textColor}
            style={{ fontSize }}
            tick={{ fill: textColor }}
          />
          <YAxis
            stroke={textColor}
            style={{ fontSize }}
            tick={{ fill: textColor }}
            tickFormatter={(value) => {
              if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
              return `$${value}`;
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span style={{ color: textColor, fontSize }}>{value}</span>
            )}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#3182ce"
            strokeWidth={2}
            name="Earnings"
            dot={{ r: dotRadius }}
            activeDot={{ r: activeDotRadius }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}

