import { Card, Box, VStack, HStack, Text, Skeleton, Tooltip } from '@chakra-ui/react';
import { HiArrowUp, HiArrowDown } from 'react-icons/hi';
import { ReactElement } from 'react';
import { formatNumber, formatPercent } from './utils/formatters';

export interface KpiCardProps {
  id?: string;
  title: string;
  value: number | string;
  change?: number; // percent change, positive or negative
  description?: string;
  icon?: ReactElement;
  onClick?: () => void;
  loading?: boolean;
  variant?: 'default' | 'compact';
}

/**
 * KPI Card component displaying a metric with optional change indicator
 * 
 * @example
 * ```tsx
 * <KpiCard
 *   title="Total Customers"
 *   value={150}
 *   change={5.2}
 *   description="Individual and group customers"
 *   icon={<HiUsers />}
 * />
 * ```
 */
export function KpiCard({
  id,
  title,
  value,
  change,
  description,
  icon,
  onClick,
  loading = false,
  variant = 'default',
}: KpiCardProps) {
  const hasChange = change !== undefined && change !== null;
  const isPositive = hasChange && change >= 0;

  const ariaLabel = `${title}: ${value}${hasChange ? ` (${isPositive ? 'up' : 'down'} ${Math.abs(change)}%)` : ''}`;

  if (loading) {
    return (
      <Card.Root>
        <Card.Body>
          <VStack align="stretch" gap={2}>
            <Skeleton height="16px" width="60%" />
            <Skeleton height="40px" width="80%" />
            {description && <Skeleton height="14px" width="40%" />}
          </VStack>
        </Card.Body>
      </Card.Root>
    );
  }

  const cardContent = (
    <Card.Root
      id={id}
      cursor={onClick ? 'pointer' : 'default'}
      onClick={onClick}
      transition="all 0.2s"
      _hover={onClick ? { transform: 'translateY(-2px)', shadow: 'md' } : {}}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      aria-label={ariaLabel}
    >
      <Card.Body p={variant === 'compact' ? { base: 3, md: 4 } : { base: 4, md: 5, lg: 6 }}>
        <VStack align="stretch" gap={variant === 'compact' ? 2 : 3}>
          {/* Header with icon and title */}
          <HStack justify="space-between" align="flex-start">
            <Text
              fontSize={variant === 'compact' ? 'sm' : { base: 'sm', md: 'md' }}
              fontWeight="medium"
              color="gray.600"
            >
              {title}
            </Text>
            {icon && (
              <Box color="blue.500" fontSize={variant === 'compact' ? { base: '18px', md: '20px' } : { base: '20px', md: '24px' }}>
                {icon}
              </Box>
            )}
          </HStack>

          {/* Value */}
          <Text
            fontSize={variant === 'compact' ? { base: 'xl', md: '2xl' } : { base: '2xl', md: '3xl' }}
            fontWeight="bold"
            color="gray.900"
            lineHeight="1.2"
          >
            {typeof value === 'number' ? formatNumber(value) : value}
          </Text>

          {/* Change indicator and description */}
          <HStack justify="space-between" align="center">
            {hasChange && (
              <HStack gap={1} color={isPositive ? 'green.600' : 'red.600'}>
                {isPositive ? (
                  <HiArrowUp size={16} />
                ) : (
                  <HiArrowDown size={16} />
                )}
                <Text fontSize="sm" fontWeight="medium">
                  {formatPercent(Math.abs(change))}
                </Text>
              </HStack>
            )}
            {description && (
              <Text fontSize="xs" color="gray.500" flex={1} textAlign="right">
                {description}
              </Text>
            )}
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );

  // Wrap in tooltip if description is long or change needs explanation
  if (description && description.length > 50) {
    return (
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{cardContent}</Tooltip.Trigger>
        <Tooltip.Content>
          {description}
        </Tooltip.Content>
      </Tooltip.Root>
    );
  }

  return cardContent;
}



