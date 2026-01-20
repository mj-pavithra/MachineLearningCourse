import { useEffect } from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';

/**
 * Trainer Salaries page
 * TODO: Implement trainer salaries list & calculate UI
 */
export default function TrainerSalariesPage() {
  useEffect(() => {
    document.title = 'Trainer Salaries • PayZhe';
  }, []);

  return (
    <Box p={{ base: 4, md: 6, lg: 8 }}>
      <Heading size={{ base: 'lg', md: 'xl' }} mb={{ base: 3, md: 4 }}>Trainer Salaries</Heading>
      <Text>// TODO: implement trainer salaries list & calculate UI</Text>
    </Box>
  );
}

