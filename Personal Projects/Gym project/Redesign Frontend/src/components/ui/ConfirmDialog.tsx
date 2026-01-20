import {
  Dialog,
} from '@chakra-ui/react';
import { ModernButton } from './ModernButton';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColorScheme?: string;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  confirmColorScheme = 'red',
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => {
      if (!e.open) onClose();
    }}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header fontSize="lg" fontWeight="bold">
            {title}
          </Dialog.Header>

          <Dialog.Body>{message}</Dialog.Body>

          <Dialog.Footer>
            <ModernButton onClick={onClose} disabled={isLoading}>
              {cancelLabel}
            </ModernButton>
            <ModernButton
              colorPalette={confirmColorScheme}
              onClick={handleConfirm}
              ml={3}
              loading={isLoading}
            >
              {confirmLabel}
            </ModernButton>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

