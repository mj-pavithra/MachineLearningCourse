import { useMemo } from 'react';
import { useToaster } from '@/components/ui/Toaster';

/**
 * Toast utility function
 * This is a wrapper around useToaster hook for easier usage
 */
export function useToast() {
  const { create } = useToaster();
  
  return useMemo(
    () => ({
      create: (options: {
        title: string;
        description?: string;
        status?: 'success' | 'error' | 'warning' | 'info';
        duration?: number;
        isClosable?: boolean;
      }) => {
        create({
          title: options.title,
          description: options.description,
          status: options.status || 'info',
          duration: options.duration,
          isClosable: options.isClosable,
        });
      },
    }),
    [create]
  );
}

