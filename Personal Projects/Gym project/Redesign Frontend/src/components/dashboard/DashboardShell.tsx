import { ReactNode } from 'react';
import { Box, Heading, VStack, HStack, Text } from '@chakra-ui/react';
import { formatTimeAgo } from './utils/formatters';

export interface DashboardShellProps {
  children: ReactNode;
  title?: string;
  lastUpdated?: Date | string;
  quickActions?: ReactNode;
  filters?: ReactNode;
}

/**
 * Dashboard shell component providing layout structure
 * 
 * @example
 * ```tsx
 * <DashboardShell
 *   title="Dashboard"
 *   lastUpdated={new Date()}
 *   quickActions={<QuickActions />}
 *   filters={<DashboardFilters />}
 * >
 *   <KpiGrid />
 *   <EarningsChartCard />
 * </DashboardShell>
 * ```
 */
export function DashboardShell({
  children,
  title = 'Dashboard',
  lastUpdated,
  quickActions,
  filters,
}: DashboardShellProps) {
  return (
    <Box
      as="main"
      role="main"
      p={{ base: 4, md: 6, lg: 8 }}
      aria-label={title}
    >
      {/* Skip to content link */}
      <a
        href="#dashboard-content"
        style={{
          position: 'absolute',
          left: '-10000px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
        onFocus={(e) => {
          e.currentTarget.style.position = 'static';
          e.currentTarget.style.width = 'auto';
          e.currentTarget.style.height = 'auto';
          e.currentTarget.style.overflow = 'visible';
          e.currentTarget.style.padding = '8px';
          e.currentTarget.style.backgroundColor = '#3b82f6';
          e.currentTarget.style.color = 'white';
          e.currentTarget.style.zIndex = '1000';
        }}
        onBlur={(e) => {
          e.currentTarget.style.position = 'absolute';
          e.currentTarget.style.left = '-10000px';
          e.currentTarget.style.width = '1px';
          e.currentTarget.style.height = '1px';
          e.currentTarget.style.overflow = 'hidden';
          e.currentTarget.style.padding = '';
          e.currentTarget.style.backgroundColor = '';
          e.currentTarget.style.color = '';
          e.currentTarget.style.zIndex = '';
        }}
      >
        Skip to content
      </a>

      <VStack align="stretch" gap={{ base: 4, md: 5, lg: 6 }}>
        {/* Header */}
        <HStack justify="space-between" align="center" flexWrap="wrap" gap={{ base: 3, md: 4 }}>
          <Heading as="h1" size={{ base: 'lg', md: 'xl' }} fontWeight="bold" color="gray.900">
            {title}
          </Heading>
          {quickActions && <Box>{quickActions}</Box>}
        </HStack>

        {/* Filters */}
        {filters && <Box>{filters}</Box>}

        {/* Main content */}
        <Box id="dashboard-content">
          {children}
        </Box>

        {/* Footer with last updated */}
        {lastUpdated && (
          <Box
            pt={4}
            borderTopWidth="1px"
            borderColor="gray.200"
            aria-live="polite"
            aria-atomic="true"
          >
            <Text fontSize="xs" color="gray.500" textAlign="center">
              Last updated: {formatTimeAgo(lastUpdated)}
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}



