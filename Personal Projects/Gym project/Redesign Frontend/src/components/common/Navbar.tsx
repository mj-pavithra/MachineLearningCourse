import {
  Box,
  Flex,
  HStack,
  IconButton,
  Text,
  Menu,
  Avatar,
} from '@chakra-ui/react';
import { HiMenu } from 'react-icons/hi';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { clearAllStores } from '@/stores';

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAllStores();
    logout();
    navigate('/sign-in');
  };

  return (
    <Box
      as="nav"
      bg="white"
      borderBottom="1px"
      borderColor="gray.200"
      px={{ base: 2, md: 4, lg: 6 }}
      py={{ base: 2, md: 3 }}
      position="sticky"
      top={0}
      zIndex={1000}
    >
      <Flex justify="space-between" align="center">
        <HStack gap={{ base: 2, md: 4 }}>
          <IconButton
            aria-label="Toggle menu"
            variant="ghost"
            display={{ base: 'block', lg: 'none' }}
            onClick={onMenuClick}
            size={{ base: 'md', md: 'md' }}
            h={{ base: '44px', md: 'auto' }}
            w={{ base: '44px', md: 'auto' }}
            minW={{ base: '44px', md: 'auto' }}
            fontSize={{ base: 'xl', md: 'lg' }}
          >
            <HiMenu />
          </IconButton>
          <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold">
            PayZhe
          </Text>
        </HStack>

        <HStack gap={{ base: 2, md: 4 }}>
          <Menu.Root>
            <Menu.Trigger>
              <HStack gap={2} cursor="pointer">
                <Avatar.Root size={{ base: 'md', md: 'sm' }}>
                  <Avatar.Fallback>{user?.name?.[0] || 'U'}</Avatar.Fallback>
                </Avatar.Root>
                <Text display={{ base: 'none', md: 'block' }} fontSize={{ base: 'md', md: 'sm' }}>
                  {user?.name || 'User'}
                </Text>
              </HStack>
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item value="logout" onClick={handleLogout}>Logout</Menu.Item>
            </Menu.Content>
          </Menu.Root>
        </HStack>
      </Flex>
    </Box>
  );
}


