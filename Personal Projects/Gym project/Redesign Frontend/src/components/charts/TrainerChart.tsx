import { Box, Skeleton, Text, useBreakpointValue } from '@chakra-ui/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TrainerChartProps {
  partTime: number;
  fullTime: number;
  isLoading?: boolean;
  height?: number;
}

const COLORS = ['#3182ce', '#38a169']; // Blue for part-time, Green for full-time

/**
 * Trainer statistics pie chart component
 * Shows breakdown of part-time vs full-time trainers
 * 
 * @example
 * ```tsx
 * <TrainerChart partTime={5} fullTime={10} />
 * ```
 */
export function TrainerChart({ partTime, fullTime, isLoading = false, height = 250 }: TrainerChartProps) {
  const total = partTime + fullTime;
  
  // Responsive chart sizing
  const outerRadius = useBreakpointValue({ base: 60, md: 80 }) || 80;
  const innerRadius = useBreakpointValue({ base: 30, md: 40 }) || 40;
  const chartHeight = useBreakpointValue({ base: 200, md: 250 }) || height;

  if (isLoading) {
    return (
      <Box p={{ base: 2, md: 4 }} width="100%">
        <Skeleton height={`${chartHeight}px`} />
      </Box>
    );
  }

  if (total === 0) {
    return (
      <Box p={{ base: 2, md: 4 }} textAlign="center" height={`${chartHeight}px`} display="flex" alignItems="center" justifyContent="center">
        <Text color="gray.500" fontSize={{ base: 'xs', md: 'sm' }}>No trainer data available</Text>
      </Box>
    );
  }

  const data = [
    { name: 'Part-time', value: partTime, percentage: total > 0 ? ((partTime / total) * 100).toFixed(1) : '0' },
    { name: 'Full-time', value: fullTime, percentage: total > 0 ? ((fullTime / total) * 100).toFixed(1) : '0' },
  ].filter((item) => item.value > 0); // Only show segments with values > 0

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
            {data.name}
          </Text>
          <Text fontSize="sm" color="gray.600">
            Count: {data.value}
          </Text>
          <Text fontSize="sm" color="gray.600">
            Percentage: {data.payload.percentage}%
          </Text>
        </Box>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show label if segment is too small
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="12px"
        fontWeight="semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Box width="100%" height={`${chartHeight}px`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => (
              <span style={{ color: entry.color, fontSize: '12px' }}>
                {value} ({entry.payload.percentage}%)
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}

