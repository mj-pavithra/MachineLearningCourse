import { Box, Portal } from '@chakra-ui/react';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  status: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  isClosable?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  create: (toast: Omit<Toast, 'id'>) => void;
  remove: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToaster() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToaster must be used within ToasterProvider');
  }
  return context;
}

export function ToasterProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const create = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration || 5000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, create, remove }}>
      {children}
      <Toaster toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  );
}

function Toaster({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <Portal>
      <Box
        position="fixed"
        top="20px"
        right="20px"
        zIndex={9999}
        display="flex"
        flexDirection="column"
        gap={2}
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </Box>
    </Portal>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const bgColor = {
    success: 'green.500',
    error: 'red.500',
    warning: 'yellow.500',
    info: 'blue.500',
  }[toast.status];

  return (
    <Box
      bg={bgColor}
      color="white"
      px={4}
      py={3}
      borderRadius="md"
      boxShadow="lg"
      minW="300px"
      maxW="400px"
    >
      <Box display="flex" justifyContent="space-between" alignItems="start" gap={2}>
        <Box flex={1}>
          <Box fontWeight="bold" mb={toast.description ? 1 : 0}>
            {toast.title}
          </Box>
          {toast.description && (
            <Box fontSize="sm" opacity={0.9}>
              {toast.description}
            </Box>
          )}
        </Box>
        {toast.isClosable && (
          <Box
            as="button"
            onClick={() => onRemove(toast.id)}
            fontSize="lg"
            lineHeight={1}
            opacity={0.8}
            _hover={{ opacity: 1 }}
          >
            ×
          </Box>
        )}
      </Box>
    </Box>
  );
}

