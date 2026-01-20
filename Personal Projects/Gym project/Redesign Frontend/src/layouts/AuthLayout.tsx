import { Box, Container } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';

/**
 * Layout for authentication pages (sign-in, reset-password, etc.)
 * Centered layout with modern gradient background
 */
export default function AuthLayout() {
  return (
    <Box
      minH="100vh"
      bg="gradient-to-br"
      bgGradient="linear(to-br, blue.50, indigo.50, purple.50)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={{ base: 4, md: 8 }}
      px={{ base: 4, md: 6 }}
    >
      <Container maxW="md" w="full">
        <Outlet />
      </Container>
    </Box>
  );
}


