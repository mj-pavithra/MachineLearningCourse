import { useEffect } from 'react';
import { HStack } from '@chakra-ui/react';
import { ModernButton } from '@/components/ui/ModernButton';
import {
  HiCurrencyDollar,
  HiCheckCircle,
  HiUserAdd,
  HiDownload,
} from 'react-icons/hi';
import { Icons } from '@/utils/icons';
import { useNavigate } from 'react-router-dom';

export interface QuickActionsProps {
  onCollectPayment?: () => void;
  onMarkAttendance?: () => void;
  onAddCustomer?: () => void;
  onNewPackage?: () => void;
  onExportReport?: () => void;
  compact?: boolean;
}

/**
 * Quick actions bar with common dashboard actions
 * 
 * @example
 * ```tsx
 * <QuickActions
 *   onCollectPayment={() => openCollectPaymentModal()}
 *   onMarkAttendance={() => openMarkAttendanceSheet()}
 *   onAddCustomer={() => navigate('/customers/new')}
 * />
 * ```
 */
export function QuickActions({
  onCollectPayment,
  onMarkAttendance,
  onAddCustomer,
  onNewPackage,
  onExportReport,
  compact = false,
}: QuickActionsProps) {
  const navigate = useNavigate();

  // Keyboard shortcuts (optional, documented)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Ctrl/Cmd + key shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'c':
            e.preventDefault();
            handleCollectPayment();
            break;
          case 'a':
            e.preventDefault();
            handleAddCustomer();
            break;
          case 'p':
            e.preventDefault();
            handleNewPackage();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleCollectPayment = () => {
    if (onCollectPayment) {
      onCollectPayment();
    } else {
      navigate('/finances/client-payments?action=create');
    }
  };

  const handleMarkAttendance = () => {
    if (onMarkAttendance) {
      onMarkAttendance();
    } else {
      navigate('/sessions?action=mark-attendance');
    }
  };

  const handleAddCustomer = () => {
    if (onAddCustomer) {
      onAddCustomer();
    } else {
      navigate('/customers?action=create');
    }
  };

  const handleNewPackage = () => {
    if (onNewPackage) {
      onNewPackage();
    } else {
      navigate('/packages?action=create');
    }
  };

  const handleExportReport = () => {
    if (onExportReport) {
      onExportReport();
    } else {
      // Default: export dashboard data
      console.log('Export report clicked');
    }
  };

  if (compact) {
    return (
      <HStack gap={{ base: 1, md: 2 }} flexWrap="wrap">
        <ModernButton
          size="sm"
          colorPalette="green"
          onClick={handleCollectPayment}
          title="Collect Payment (Ctrl+C)"
        >
          <HiCurrencyDollar />
          Collect
        </ModernButton>
        <ModernButton
          size="sm"
          colorPalette="blue"
          onClick={handleMarkAttendance}
        >
          <HiCheckCircle />
          Attendance
        </ModernButton>
        <ModernButton
          size="sm"
          colorPalette="purple"
          onClick={handleAddCustomer}
          title="Add Customer (Ctrl+A)"
        >
          <HiUserAdd />
          Customer
        </ModernButton>
        <ModernButton
          size="sm"
          colorPalette="orange"
          onClick={handleNewPackage}
          title="New Package (Ctrl+P)"
        >
          <Icons.Package />
          Package
        </ModernButton>
        <ModernButton
          size="sm"
          variant="outline"
          onClick={handleExportReport}
        >
          <HiDownload />
          Export
        </ModernButton>
      </HStack>
    );
  }

  return (
    <HStack gap={2} flexWrap="wrap">
      <ModernButton
        size="md"
        colorPalette="green"
        onClick={handleCollectPayment}
        title="Collect Payment (Ctrl+C)"
      >
        <HiCurrencyDollar />
        Collect Payment
      </ModernButton>
      <ModernButton
        size="md"
        colorPalette="blue"
        onClick={handleMarkAttendance}
      >
        <HiCheckCircle />
        Mark Attendance
      </ModernButton>
      <ModernButton
        size="md"
        colorPalette="purple"
        onClick={handleAddCustomer}
        title="Add Customer (Ctrl+A)"
      >
        <HiUserAdd />
        Add Customer
      </ModernButton>
      <ModernButton
        size="md"
        colorPalette="orange"
        onClick={handleNewPackage}
        title="New Package (Ctrl+P)"
      >
        <Icons.Package />
        New Package
      </ModernButton>
      <ModernButton
        size="md"
        variant="outline"
        onClick={handleExportReport}
      >
        <HiDownload />
        Export Report
      </ModernButton>
    </HStack>
  );
}



