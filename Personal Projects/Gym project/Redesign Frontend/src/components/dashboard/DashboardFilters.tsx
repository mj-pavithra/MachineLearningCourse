import { useState, useEffect, useCallback } from 'react';
import { Box, HStack, VStack, NativeSelect, Badge, Text } from '@chakra-ui/react';
import { ModernButton } from '@/components/ui/ModernButton';
import { useSearchParams } from 'react-router-dom';
import { HiX } from 'react-icons/hi';
import { DashboardFilters as DashboardFiltersType, DateRangePreset } from '@/types/dashboard';
import { SearchInput } from '@/components/ui/SearchInput';
import { subDays, format, parseISO } from 'date-fns';

export interface DashboardFiltersProps {
  filters: DashboardFiltersType;
  onFiltersChange: (filters: DashboardFiltersType | ((prevFilters: DashboardFiltersType) => DashboardFiltersType)) => void;
  trainers?: Array<{ id: string; name: string }>;
  packages?: Array<{ id: string; name: string }>;
  loading?: boolean;
}

/**
 * Dashboard filters component with date range, trainer, package, and search
 * Supports deep-linking via URL search params
 * 
 * @example
 * ```tsx
 * <DashboardFilters
 *   filters={currentFilters}
 *   onFiltersChange={setFilters}
 *   trainers={trainersList}
 *   packages={packagesList}
 * />
 * ```
 */
export function DashboardFilters({
  filters,
  onFiltersChange,
  trainers = [],
  packages = [],
  loading = false,
}: DashboardFiltersProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('30d');

  // Sync URL params to filters on mount
  useEffect(() => {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const q = searchParams.get('q');
    const trainerId = searchParams.get('trainerId');
    const packageId = searchParams.get('packageId');

    if (from || to || q || trainerId || packageId) {
      const urlFilters: DashboardFiltersType = {
        ...(from && to && { dateRange: { from, to } }),
        ...(q && { search: q }),
        ...(trainerId && { trainerId }),
        ...(packageId && { packageId }),
      };
      onFiltersChange(urlFilters);
      setLocalSearch(q || '');
    }
  }, []); // Only on mount

  // Update URL params when filters change
  useEffect(() => {
    const newParams = new URLSearchParams();
    
    if (filters.dateRange) {
      newParams.set('from', filters.dateRange.from);
      newParams.set('to', filters.dateRange.to);
    }
    if (filters.search) {
      newParams.set('q', filters.search);
    }
    if (filters.trainerId) {
      newParams.set('trainerId', filters.trainerId);
    }
    if (filters.packageId) {
      newParams.set('packageId', filters.packageId);
    }

    setSearchParams(newParams, { replace: true });
  }, [filters, setSearchParams]);

  const handleDatePresetChange = (preset: DateRangePreset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      const today = new Date();
      const to = format(today, 'yyyy-MM-dd');
      let from: string;
      
      switch (preset) {
        case '7d':
          from = format(subDays(today, 7), 'yyyy-MM-dd');
          break;
        case '30d':
          from = format(subDays(today, 30), 'yyyy-MM-dd');
          break;
        case '90d':
          from = format(subDays(today, 90), 'yyyy-MM-dd');
          break;
        default:
          return;
      }
      
      onFiltersChange((prevFilters) => ({
        ...prevFilters,
        dateRange: { from, to },
      }));
    }
  };

  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value);
    onFiltersChange((prevFilters) => ({
      ...prevFilters,
      search: value || undefined,
    }));
  }, [onFiltersChange]);

  const handleTrainerChange = (trainerId: string) => {
    onFiltersChange((prevFilters) => ({
      ...prevFilters,
      trainerId: trainerId || undefined,
    }));
  };

  const handlePackageChange = (packageId: string) => {
    onFiltersChange((prevFilters) => ({
      ...prevFilters,
      packageId: packageId || undefined,
    }));
  };

  const handleReset = () => {
    setLocalSearch('');
    setDatePreset('30d');
    onFiltersChange({});
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters =
    filters.dateRange ||
    filters.search ||
    filters.trainerId ||
    filters.packageId;

  return (
    <Box
      p={4}
      bg="white"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="gray.200"
      mb={6}
    >
      <VStack align="stretch" gap={4}>
        {/* Filter controls */}
        <HStack gap={4} flexWrap="wrap" align="flex-end">
          {/* Date range preset */}
          <Box minW={{ base: 'full', sm: '150px' }}>
            <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
              Date Range
            </Text>
            <NativeSelect.Root size="md">
              <NativeSelect.Field
                value={datePreset}
                onChange={(e) => handleDatePresetChange(e.target.value as DateRangePreset)}
                aria-label="Date range selector"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="custom">Custom range</option>
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Box>

          {/* Trainer selector */}
          <Box minW={{ base: 'full', sm: '150px' }}>
            <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
              Trainer
            </Text>
            <NativeSelect.Root size="md">
              <NativeSelect.Field
                value={filters.trainerId || ''}
                onChange={(e) => handleTrainerChange(e.target.value)}
                aria-label="Trainer selector"
              >
                <option value="">All trainers</option>
                {trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Box>

          {/* Package selector */}
          <Box minW={{ base: 'full', sm: '150px' }}>
            <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
              Package
            </Text>
            <NativeSelect.Root size="md">
              <NativeSelect.Field
                value={filters.packageId || ''}
                onChange={(e) => handlePackageChange(e.target.value)}
                aria-label="Package selector"
              >
                <option value="">All packages</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Box>

          {/* Search */}
          <Box flex={1} minW={{ base: 'full', sm: '200px' }}>
            <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
              Search
            </Text>
            <SearchInput
              value={localSearch}
              onChange={setLocalSearch}
              onDebouncedChange={handleSearchChange}
              placeholder="Search customers, payments..."
              debounceDelay={300}
              isLoading={loading}
            />
          </Box>

          {/* Reset button */}
          {hasActiveFilters && (
            <ModernButton
              size="md"
              variant="ghost"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </ModernButton>
          )}
        </HStack>

        {/* Active filter badges */}
        {hasActiveFilters && (
          <HStack gap={2} flexWrap="wrap">
            <Text fontSize="sm" color="gray.600">
              Active filters:
            </Text>
            {filters.dateRange && (
              <Badge colorPalette="blue">
                {format(parseISO(filters.dateRange.from), 'MMM dd')} -{' '}
                {format(parseISO(filters.dateRange.to), 'MMM dd')}
                <ModernButton
                  size="xs"
                  variant="ghost"
                  ml={1}
                  onClick={() =>
                    onFiltersChange((prevFilters) => ({ ...prevFilters, dateRange: undefined }))
                  }
                  aria-label="Remove date range filter"
                >
                  <HiX />
                </ModernButton>
              </Badge>
            )}
            {filters.search && (
              <Badge colorPalette="green">
                Search: {filters.search}
                <ModernButton
                  size="xs"
                  variant="ghost"
                  ml={1}
                  onClick={() =>
                    onFiltersChange((prevFilters) => ({ ...prevFilters, search: undefined }))
                  }
                  aria-label="Remove search filter"
                >
                  <HiX />
                </ModernButton>
              </Badge>
            )}
            {filters.trainerId && (
              <Badge colorPalette="purple">
                Trainer: {trainers.find((t) => t.id === filters.trainerId)?.name || filters.trainerId}
                <ModernButton
                  size="xs"
                  variant="ghost"
                  ml={1}
                  onClick={() =>
                    onFiltersChange((prevFilters) => ({ ...prevFilters, trainerId: undefined }))
                  }
                  aria-label="Remove trainer filter"
                >
                  <HiX />
                </ModernButton>
              </Badge>
            )}
            {filters.packageId && (
              <Badge colorPalette="orange">
                Package: {packages.find((p) => p.id === filters.packageId)?.name || filters.packageId}
                <ModernButton
                  size="xs"
                  variant="ghost"
                  ml={1}
                  onClick={() =>
                    onFiltersChange((prevFilters) => ({ ...prevFilters, packageId: undefined }))
                  }
                  aria-label="Remove package filter"
                >
                  <HiX />
                </ModernButton>
              </Badge>
            )}
          </HStack>
        )}
      </VStack>
    </Box>
  );
}

