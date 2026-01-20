import { Box, VStack, Heading, Text, Card } from '@chakra-ui/react';
import { ModernButton } from '@/components/ui/ModernButton';
import { HiInbox } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

interface DashboardEmptyProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionPath?: string;
  onAction?: () => void;
}

/**
 * Empty state component for dashboard when no data is available
 */
export function DashboardEmpty({
  title = 'No Data Available',
  description = 'There is no data to display on the dashboard at this time.',
  actionLabel = 'Get Started',
  actionPath,
  onAction,
}: DashboardEmptyProps) {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionPath) {
      navigate(actionPath);
    }
  };

  return (
    <Card.Root>
      <Card.Body>
        <Box py={12} textAlign="center">
          <VStack gap={4} align="center">
            <Box fontSize="64px" color="gray.300">
              <HiInbox />
            </Box>
            <VStack gap={2}>
              <Heading size="lg" color="gray.700">
                {title}
              </Heading>
              <Text color="gray.600" maxW="400px">
                {description}
              </Text>
            </VStack>
            {(actionPath || onAction) && (
              <ModernButton
                colorPalette="blue"
                onClick={handleAction}
                mt={4}
              >
                {actionLabel}
              </ModernButton>
            )}
          </VStack>
        </Box>
      </Card.Body>
    </Card.Root>
  );
}



