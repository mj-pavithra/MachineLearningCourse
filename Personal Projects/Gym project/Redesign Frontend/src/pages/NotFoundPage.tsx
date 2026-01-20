import { useEffect } from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { ModernButton } from '@/components/ui/ModernButton';

/**
 * 404 Not Found page
 */
export default function NotFoundPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = '404 Not Found • PayZhe';
  }, []);

  return (
    <Box textAlign="center" py={{ base: 12, md: 16, lg: 20 }} px={{ base: 4, md: 6 }}>
      <Heading size={{ base: 'xl', md: '2xl' }} mb={{ base: 3, md: 4 }}>404</Heading>
      <Text fontSize={{ base: 'lg', md: 'xl' }} mb={{ base: 6, md: 8 }}>Page not found</Text>
      <ModernButton onClick={() => navigate('/dashboard')} colorPalette="blue">
        Go to Dashboard
      </ModernButton>
    </Box>
  );
}


