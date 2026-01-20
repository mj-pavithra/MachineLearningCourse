import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Heading } from '@chakra-ui/react';

/**
 * Finances page (parent route for nested finances routes)
 * TODO: Implement finances overview
 */
export default function FinancesPage() {
  useEffect(() => {
    document.title = 'Finances • PayZhe';
  }, []);

  return (
    <Box p={{ base: 4, md: 6, lg: 8 }}>
      <Heading size={{ base: 'lg', md: 'xl' }} mb={{ base: 3, md: 4 }}>Finances</Heading>
      {/* Nested routes will render here */}
      <Outlet />
    </Box>
  );
}

