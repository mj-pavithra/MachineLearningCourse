import {
  Box,
  VStack,
  Text,
  Drawer,
} from '@chakra-ui/react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiUser,
  FiPackage,
  FiBox,
  FiDollarSign,
  FiCalendar,
  FiCheckCircle,
} from 'react-icons/fi';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: FiHome },
  { path: '/customers', label: 'Customers', icon: FiUsers },
  { path: '/trainers', label: 'Trainers', icon: FiUser },
  { path: '/packages', label: 'Packages', icon: FiPackage },
  { path: '/equipment', label: 'Equipment', icon: FiBox },
  { path: '/finances', label: 'Finances', icon: FiDollarSign },
  { path: '/sessions', label: 'Sessions', icon: FiCalendar },
  { path: '/attendance', label: 'Attendance', icon: FiCheckCircle },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const bg = 'white';
  const borderColor = 'gray.200';
  const activeBg = 'brand.50';
  const activeColor = 'brand.600';

  const SidebarContent = () => (
    <VStack gap={1} align="stretch" p={{ base: 3, md: 4 }}>
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
        
        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              borderRadius: '6px',
              backgroundColor: isActive ? activeBg : 'transparent',
              color: isActive ? activeColor : 'inherit',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'rgb(243, 244, 246)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <Icon style={{ marginRight: '12px', fontSize: '18px' }} />
            <Text fontWeight={isActive ? 'semibold' : 'normal'} fontSize={{ base: 'sm', md: 'md' }}>{item.label}</Text>
          </NavLink>
        );
      })}
    </VStack>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <Box
        as="aside"
        w="250px"
        bg={bg}
        borderRight="1px"
        borderColor={borderColor}
        position="fixed"
        left={0}
        top="64px"
        h="calc(100vh - 64px)"
        overflowY="auto"
        display={{ base: 'none', lg: 'block' }}
      >
        <SidebarContent />
      </Box>

      {/* Mobile Drawer */}
      <Drawer.Root open={isOpen} placement="start" onOpenChange={(e) => !e.open && onClose()}>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.CloseTrigger />
            <Drawer.Header>Menu</Drawer.Header>
            <Drawer.Body p={0}>
              <SidebarContent />
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </>
  );
}


