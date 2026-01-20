import { Box, Flex } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/common/Navbar';
import { Sidebar } from '@/components/common/Sidebar';
import { useState } from 'react';

/**
 * Layout for authenticated pages
 * Includes sidebar navigation and top navbar
 */
export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Flex>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Box
          as="main"
          flex="1"
          ml={{ base: 0, lg: '250px' }}
          w="full"
          maxW="100vw"
          overflowX="hidden"
          transition="margin-left 0.2s"
        >
          <Outlet />
        </Box>
      </Flex>
    </Box>
  );
}


