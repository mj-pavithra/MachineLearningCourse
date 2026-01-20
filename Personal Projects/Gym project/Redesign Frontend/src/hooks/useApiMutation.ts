/**
 * Standardized mutation hook for API operations
 * Provides consistent patterns for cache invalidation and optimistic updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';
import { ApiError } from '@/services/api/types';
import { useToast } from '@/utils/toast';
import { getErrorMessage } from '@/utils/error';

/**
 * Standard mutation options for API operations
 */
export interface UseApiMutationOptions<TData, TVariables, TContext = unknown> {
  resource: keyof typeof queryKeys;
  subResource?: string; // For nested resources like 'clientPayments', 'trainerSalaries'
  onSuccess?: (data: TData, variables: TVariables, context: TContext) => void;
  onError?: (error: ApiError, variables: TVariables, context: TContext | undefined) => void;
  optimisticUpdate?: boolean; // Enable optimistic updates
  invalidateQueries?: boolean; // Invalidate queries on success (default: true)
  showErrorToast?: boolean; // Show error toast (default: true)
  showSuccessToast?: boolean; // Show success toast (default: false)
  successMessage?: string;
}

/**
 * Standardized mutation hook for API operations
 * 
 * @example
 * ```typescript
 * const createMutation = useApiMutation({
 *   mutationFn: createCustomer,
 *   resource: 'customers',
 *   successMessage: 'Customer created successfully',
 * });
 * ```
 */
export function useApiMutation<TData, TVariables, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseApiMutationOptions<TData, TVariables, TContext> & {
    mutationFn: (variables: TVariables) => Promise<TData>;
  }
) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const {
    resource,
    subResource,
    onSuccess: customOnSuccess,
    onError: customOnError,
    optimisticUpdate = false,
    invalidateQueries = true,
    showErrorToast = true,
    showSuccessToast = false,
    successMessage,
    ...mutationOptions
  } = options;

  // Get query key for invalidation
  const getQueryKey = () => {
    if (subResource && resource === 'finances') {
      if (subResource === 'clientPayments') {
        return queryKeys.finances.clientPayments.all;
      }
      if (subResource === 'trainerSalaries') {
        return queryKeys.finances.trainerSalaries.all;
      }
    }
    return queryKeys[resource].all;
  };

  return useMutation<TData, ApiError, TVariables, TContext>({
    ...mutationOptions,
    mutationFn,
    onMutate: optimisticUpdate
      ? async () => {
          // Cancel outgoing refetches
          await queryClient.cancelQueries({ queryKey: getQueryKey() });

          // Snapshot previous value
          const previous = queryClient.getQueryData(getQueryKey());

          // Return context for rollback
          return previous as TContext;
        }
      : undefined,
    onSuccess: (data, variables, context) => {
      // Invalidate queries to refetch
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: getQueryKey() });
      }

      // Show success toast
      if (showSuccessToast && successMessage) {
        toast.create({
          title: 'Success',
          description: successMessage,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      // Call custom onSuccess
      if (customOnSuccess) {
        customOnSuccess(data, variables, context as TContext);
      }
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (optimisticUpdate && context) {
        queryClient.setQueryData(getQueryKey(), context);
      }

      // Show error toast
      if (showErrorToast) {
        toast.create({
          title: 'Error',
          description: getErrorMessage(error),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }

      // Call custom onError
      if (customOnError) {
        customOnError(error, variables, context);
      }
    },
    onSettled: () => {
      // Always refetch after error or success (if not using optimistic updates)
      if (!optimisticUpdate && invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: getQueryKey() });
      }
    },
  });
}

