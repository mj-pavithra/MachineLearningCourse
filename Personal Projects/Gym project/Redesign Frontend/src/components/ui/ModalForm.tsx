import {
  Dialog,
  Box,
  Text,
  HStack,
  VStack,
  Spinner,
  IconButton,
} from '@chakra-ui/react';
import { ReactNode, useEffect, useRef } from 'react';
import { HiX } from 'react-icons/hi';
import { ModernButton } from './ModernButton';

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
  title: string;
  children: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  icon?: ReactNode; // Optional icon for header
  description?: string; // Optional description text
  maxHeight?: string; // Max height for scrollable content
  showCloseButton?: boolean; // Show close button in header
}

export function ModalForm({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isLoading = false,
  isDisabled = false,
  size = 'md',
  icon,
  description,
  maxHeight,
  showCloseButton = true,
}: ModalFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const originalOverflowRef = useRef<string | null>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store original overflow value if not already stored
      if (originalOverflowRef.current === null) {
        originalOverflowRef.current = window.getComputedStyle(document.body).overflow;
      }
      document.body.style.overflow = 'hidden';
      
      // Focus first input after a short delay to allow animation
      const timer = setTimeout(() => {
        if (formRef.current) {
          const firstInput = formRef.current.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
            'input:not([type="hidden"]), select, textarea'
          );
          if (firstInput) {
            firstInput.focus();
          }
        }
      }, 100);

      return () => {
        // Always restore original overflow value when modal closes
        if (originalOverflowRef.current !== null) {
          document.body.style.overflow = originalOverflowRef.current;
          originalOverflowRef.current = null;
        } else {
          // Fallback: restore to 'auto' if original value was lost
          document.body.style.overflow = 'auto';
        }
        clearTimeout(timer);
      };
    }
    // No else block needed - cleanup function handles restoration when isOpen becomes false
  }, [isOpen]);

  // Cleanup on unmount to ensure scrolling is always restored
  useEffect(() => {
    return () => {
      if (originalOverflowRef.current !== null) {
        document.body.style.overflow = originalOverflowRef.current;
        originalOverflowRef.current = null;
      } else {
        // Fallback: restore to 'auto' if original value was lost
        document.body.style.overflow = 'auto';
      }
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
      // Prevent form submission on Enter outside of form
      if (e.key === 'Enter' && e.target instanceof HTMLElement) {
        const isFormElement = e.target.tagName === 'INPUT' || 
                             e.target.tagName === 'SELECT' || 
                             e.target.tagName === 'TEXTAREA' ||
                             e.target.tagName === 'BUTTON';
        if (!isFormElement && formRef.current) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading && !isDisabled) {
      await onSubmit();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  // Calculate responsive size - Dialog.Root only accepts string, not responsive object
  const dialogSize = size === 'full' ? 'lg' : size;

  // Calculate max height for scrollable content
  const contentMaxHeight = maxHeight || { base: 'calc(100vh - 200px)', md: 'calc(100vh - 300px)' };

  return (
    <Dialog.Root 
      open={isOpen} 
      onOpenChange={(e) => {
        if (!e.open && !isLoading) {
          handleClose();
        }
      }} 
      size={dialogSize}
    >
      <Dialog.Backdrop 
        bg="blackAlpha.600"
        backdropFilter="blur(4px)"
        transition="opacity 0.2s ease-in-out"
      />
      <Dialog.Positioner
        position="fixed"
        inset={0}
        zIndex={1400}
        display="flex"
        alignItems={{ base: 'flex-end', md: 'center' }}
        justifyContent="center"
        p={{ base: 0, md: 4 }}
      >
        <Dialog.Content
          width={{ base: '100vw', md: '90%', lg: 'auto' }}
          maxWidth={{ 
            base: '100vw', 
            sm: '100vw',
            md: size === 'full' ? '100%' : size === 'xl' ? '1200px' : size === 'lg' ? '900px' : size === 'md' ? '700px' : size === 'sm' ? '500px' : '400px',
            lg: size === 'full' ? '100%' : size === 'xl' ? '1400px' : size === 'lg' ? '1100px' : size === 'md' ? '900px' : size === 'sm' ? '600px' : '500px'
          }}
          maxHeight={{ base: '100vh', md: '90vh' }}
          height={{ base: '100vh', sm: '100vh', md: 'auto' }}
          borderRadius={{ base: 0, md: '12px' }}
          boxShadow={{ base: 'none', md: '0 10px 40px rgba(0,0,0,0.2)' }}
          display="flex"
          flexDirection="column"
          bg="white"
          _dark={{ bg: 'gray.800' }}
          transition="all 0.2s ease-in-out"
          transform={{ base: isOpen ? 'translateY(0)' : 'translateY(100%)', md: isOpen ? 'scale(1)' : 'scale(0.95)' }}
          opacity={isOpen ? 1 : 0}
        >
          <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* Header */}
          <Dialog.Header
            p={{ base: 4, md: 6 }}
            pb={{ base: 3, md: 4 }}
            borderBottomWidth="1px"
            borderColor="gray.200"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            flexShrink={0}
            bg="gray.50"
            _dark={{ borderColor: 'gray.700', bg: 'gray.900' }}
            borderRadius={{ base: '16px 16px 0 0', md: '12px 12px 0 0' }}
          >
            <HStack gap={3} flex={1} align="center">
              {icon && (
                <Box color="blue.500" fontSize="xl">
                  {icon}
                </Box>
              )}
              <VStack align="flex-start" gap={0} flex={1}>
                <Text
                  fontSize={{ base: 'xl', md: '2xl' }}
                  fontWeight="semibold"
                  color="gray.900"
                  _dark={{ color: 'gray.100' }}
                >
                  {title}
                </Text>
                {description && (
                  <Text
                    fontSize={{ base: 'sm', md: 'md' }}
                    color="gray.600"
                    _dark={{ color: 'gray.400' }}
                    mt={0.5}
                  >
                    {description}
                  </Text>
                )}
              </VStack>
            </HStack>
            {showCloseButton && (
              <IconButton
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={isLoading}
                aria-label="Close dialog"
                h={{ base: '40px', md: 'auto' }}
                w={{ base: '40px', md: 'auto' }}
                minW={{ base: '40px', md: 'auto' }}
                fontSize={{ base: 'xl', md: 'md' }}
                color="gray.500"
                _hover={{ color: 'gray.700', bg: 'gray.100' }}
                _dark={{ color: 'gray.400', _hover: { color: 'gray.200', bg: 'gray.700' } }}
              >
                <HiX />
              </IconButton>
            )}
          </Dialog.Header>

          {/* Scrollable Body */}
          <style>{`
            .modal-form-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            .modal-form-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .modal-form-scrollbar::-webkit-scrollbar-thumb {
              background: #CBD5E0;
              border-radius: 4px;
            }
            .modal-form-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #A0AEC0;
            }
            @media (prefers-color-scheme: dark) {
              .modal-form-scrollbar::-webkit-scrollbar-thumb {
                background: #4A5568;
              }
              .modal-form-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #718096;
              }
            }
          `}</style>
          <Dialog.Body
            p={{ base: 5, md: 6 }}
            flex={1}
            overflowY="auto"
            overflowX="hidden"
            maxHeight={contentMaxHeight}
            className="modal-form-scrollbar"
          >
            {/* Loading Overlay */}
            {isLoading && (
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bg="whiteAlpha.800"
                _dark={{ bg: 'gray.800' }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                zIndex={10}
                borderRadius={{ base: '0 0 16px 16px', md: '0 0 12px 12px' }}
              >
                <VStack gap={3}>
                  <Spinner size="lg" colorPalette="blue" />
                  <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                    Processing...
                  </Text>
                </VStack>
              </Box>
            )}

            {/* Form Content */}
            <Box
              opacity={isLoading ? 0.5 : 1}
              pointerEvents={isLoading ? 'none' : 'auto'}
              transition="opacity 0.2s"
            >
              {children}
            </Box>
          </Dialog.Body>

          {/* Footer */}
          <Dialog.Footer
            p={{ base: 4, md: 6 }}
            pt={{ base: 3, md: 4 }}
            borderTopWidth="1px"
            borderColor="gray.200"
            display="flex"
            flexDirection={{ base: 'column', sm: 'row' }}
            gap={{ base: 2, sm: 3 }}
            justifyContent="flex-end"
            flexShrink={0}
            bg="gray.50"
            _dark={{ borderColor: 'gray.700', bg: 'gray.900' }}
            borderRadius={{ base: '0 0 16px 16px', md: '0 0 12px 12px' }}
          >
            <ModernButton
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
              width={{ base: '100%', sm: 'auto' }}
              minH={{ base: '44px', sm: 'auto' }}
              fontSize={{ base: 'md', sm: 'sm' }}
            >
              {cancelLabel}
            </ModernButton>
            <ModernButton
              type="submit"
              colorPalette="blue"
              loading={isLoading}
              disabled={isDisabled || isLoading}
              width={{ base: '100%', sm: 'auto' }}
              minH={{ base: '44px', sm: 'auto' }}
              fontSize={{ base: 'md', sm: 'sm' }}
              fontWeight="semibold"
            >
              {submitLabel}
            </ModernButton>
          </Dialog.Footer>
          </form>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
