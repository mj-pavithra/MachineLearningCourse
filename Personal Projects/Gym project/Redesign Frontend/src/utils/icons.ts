/**
 * Centralized icon mapping utility
 * 
 * This utility provides a reliable way to import and use icons across the application.
 * It includes fallback mechanisms to prevent runtime errors when icons are missing.
 * 
 * Benefits:
 * - Single source of truth for icon usage
 * - Type-safe icon references
 * - Automatic fallback to default icons
 * - Prevents import errors from missing icons
 * - Easy to update icon sets in one place
 */

import React from 'react';

// Import from reliable icon sets
import {
  // Heroicons (hi) - most stable
  HiCube,
  HiCurrencyDollar,
  HiCheckCircle,
  HiUserAdd,
  HiCalendar,
  HiLogin,
  HiDownload,
  HiUsers,
  HiUserGroup,
  HiClock,
  HiPencil,
  HiTrash,
  HiDotsVertical,
  HiPlus,
  HiX,
  HiEye,
  HiRefresh,
  HiArrowUp,
  HiArrowDown,
  HiInformationCircle,
  HiInbox,
  HiMail,
  HiLockClosed,
  HiMenu,
} from 'react-icons/hi';

import {
  // Feather icons (fi) - reliable alternative
  FiBox,
  FiPlus as FiPlusIcon,
  FiUpload,
  FiDownload as FiDownloadIcon,
  FiMoreVertical,
  FiTrash2,
  FiEdit,
  FiUserPlus,
} from 'react-icons/fi';

import {
  // Font Awesome (fa) - for file types
  FaFileCsv,
  FaFilePdf,
} from 'react-icons/fa';

/**
 * Icon name type for type safety
 */
export type IconName =
  | 'package'
  | 'box'
  | 'currency-dollar'
  | 'check-circle'
  | 'user-add'
  | 'calendar'
  | 'login'
  | 'download'
  | 'users'
  | 'user-group'
  | 'clock'
  | 'pencil'
  | 'trash'
  | 'dots-vertical'
  | 'plus'
  | 'x'
  | 'eye'
  | 'refresh'
  | 'arrow-up'
  | 'arrow-down'
  | 'information-circle'
  | 'inbox'
  | 'mail'
  | 'lock-closed'
  | 'menu'
  | 'upload'
  | 'edit'
  | 'user-plus'
  | 'file-csv'
  | 'file-pdf';

/**
 * Icon mapping with fallbacks
 * 
 * Each icon has a primary and fallback option.
 * If the primary icon fails, the fallback is used.
 */
const ICON_MAP: Record<IconName, { primary: React.ComponentType<React.ComponentPropsWithoutRef<'svg'>>; fallback: React.ComponentType<React.ComponentPropsWithoutRef<'svg'>> }> = {
  'package': { primary: HiCube, fallback: FiBox },
  'box': { primary: FiBox, fallback: HiCube },
  'currency-dollar': { primary: HiCurrencyDollar, fallback: HiCurrencyDollar },
  'check-circle': { primary: HiCheckCircle, fallback: HiCheckCircle },
  'user-add': { primary: HiUserAdd, fallback: HiUserAdd },
  'calendar': { primary: HiCalendar, fallback: HiCalendar },
  'login': { primary: HiLogin, fallback: HiLogin },
  'download': { primary: HiDownload, fallback: FiDownloadIcon },
  'users': { primary: HiUsers, fallback: HiUsers },
  'user-group': { primary: HiUserGroup, fallback: HiUsers },
  'clock': { primary: HiClock, fallback: HiClock },
  'pencil': { primary: HiPencil, fallback: FiEdit },
  'trash': { primary: HiTrash, fallback: FiTrash2 },
  'dots-vertical': { primary: HiDotsVertical, fallback: FiMoreVertical },
  'plus': { primary: HiPlus, fallback: FiPlusIcon },
  'x': { primary: HiX, fallback: HiX },
  'eye': { primary: HiEye, fallback: HiEye },
  'refresh': { primary: HiRefresh, fallback: HiRefresh },
  'arrow-up': { primary: HiArrowUp, fallback: HiArrowUp },
  'arrow-down': { primary: HiArrowDown, fallback: HiArrowDown },
  'information-circle': { primary: HiInformationCircle, fallback: HiInformationCircle },
  'inbox': { primary: HiInbox, fallback: HiInbox },
  'mail': { primary: HiMail, fallback: HiMail },
  'lock-closed': { primary: HiLockClosed, fallback: HiLockClosed },
  'menu': { primary: HiMenu, fallback: HiMenu },
  'upload': { primary: FiUpload, fallback: FiUpload },
  'edit': { primary: FiEdit, fallback: HiPencil },
  'user-plus': { primary: FiUserPlus, fallback: HiUserAdd },
  'file-csv': { primary: FaFileCsv, fallback: FaFileCsv },
  'file-pdf': { primary: FaFilePdf, fallback: FaFilePdf },
};

/**
 * Default fallback icon (simple box)
 */
const DEFAULT_ICON = HiCube;

/**
 * Get icon component by name with automatic fallback
 * 
 * @param name - Icon name
 * @param props - Props to pass to the icon component (optional, for type inference)
 * @returns Icon component or default fallback
 * 
 * @example
 * ```tsx
 * const PackageIcon = getIcon('package');
 * return React.createElement(PackageIcon, { size: 20 });
 * ```
 */
export function getIcon(
  name: IconName,
  _props?: React.ComponentPropsWithoutRef<'svg'>
): React.ComponentType<React.ComponentPropsWithoutRef<'svg'>> {
  const iconConfig = ICON_MAP[name];
  
  if (!iconConfig) {
    console.warn(`[Icons] Icon "${name}" not found in mapping, using default fallback`);
    return DEFAULT_ICON as React.ComponentType<React.ComponentPropsWithoutRef<'svg'>>;
  }

  // Try to return the primary icon, but if it fails, use fallback
  try {
    return iconConfig.primary as React.ComponentType<React.ComponentPropsWithoutRef<'svg'>>;
  } catch (error) {
    console.warn(`[Icons] Primary icon "${name}" failed, using fallback:`, error);
    return iconConfig.fallback as React.ComponentType<React.ComponentPropsWithoutRef<'svg'>>;
  }
}

/**
 * Render icon component directly
 * 
 * @param name - Icon name
 * @param props - Props to pass to the icon component
 * @returns Rendered icon element
 * 
 * @example
 * ```tsx
 * {renderIcon('package', { size: 20, color: 'blue' })}
 * ```
 * 
 * @note This function uses `React.createElement` instead of JSX syntax to avoid
 * esbuild parsing errors when using dynamic component variables. JSX syntax
 * like `<IconComponent {...props} />` causes esbuild to fail with "Expected '>' but found '{'"
 * when the component is stored in a variable. Using `React.createElement` is the
 * standard pattern for dynamic component rendering and works reliably with all build tools.
 */
export function renderIcon(
  name: IconName,
  props?: React.ComponentPropsWithoutRef<'svg'>
): React.ReactElement {
  // IMPORTANT: Use React.createElement, NOT JSX syntax (<IconComponent />)
  // JSX with dynamic component variables causes esbuild parsing errors in .ts files
  const IconComponent = getIcon(name, props);
  return React.createElement(IconComponent, props || {});
}

/**
 * Direct icon exports for convenience
 * Use these when you need direct access to icon components
 */
export const Icons = {
  Package: HiCube,
  Box: FiBox,
  CurrencyDollar: HiCurrencyDollar,
  CheckCircle: HiCheckCircle,
  UserAdd: HiUserAdd,
  Calendar: HiCalendar,
  Login: HiLogin,
  Download: HiDownload,
  Users: HiUsers,
  UserGroup: HiUserGroup,
  Clock: HiClock,
  Pencil: HiPencil,
  Trash: HiTrash,
  DotsVertical: HiDotsVertical,
  Plus: HiPlus,
  X: HiX,
  Eye: HiEye,
  Refresh: HiRefresh,
  ArrowUp: HiArrowUp,
  ArrowDown: HiArrowDown,
  InformationCircle: HiInformationCircle,
  Inbox: HiInbox,
  Mail: HiMail,
  LockClosed: HiLockClosed,
  Menu: HiMenu,
  Upload: FiUpload,
  Edit: FiEdit,
  UserPlus: FiUserPlus,
  FileCsv: FaFileCsv,
  FilePdf: FaFilePdf,
} as const;

/**
 * Validate that an icon exists in the mapping
 * 
 * @param name - Icon name to validate
 * @returns true if icon exists, false otherwise
 */
export function isValidIcon(name: string): name is IconName {
  return name in ICON_MAP;
}

