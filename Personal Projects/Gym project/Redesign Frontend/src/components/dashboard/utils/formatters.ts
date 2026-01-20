import { format, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Format a number as currency
 * @param value - Number to format
 * @param currency - Currency code (default: 'LKR')
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency: string = 'LKR',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number with thousand separators
 * @param value - Number to format
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted number string
 */
export function formatNumber(value: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number as percentage
 * @param value - Number to format (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a date to a readable string
 * @param date - Date string (ISO) or Date object
 * @param formatStr - Format string (default: 'MMM dd, yyyy')
 * @param fallback - Fallback string for invalid dates (default: '-')
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | null | undefined,
  formatStr: string = 'MMM dd, yyyy',
  fallback: string = '-'
): string {
  // Handle null/undefined/empty
  if (!date) {
    return fallback;
  }

  // Parse date
  let dateObj: Date;
  if (typeof date === 'string') {
    // Handle empty strings
    if (date.trim() === '') {
      return fallback;
    }
    dateObj = parseISO(date);
  } else {
    dateObj = date;
  }

  // Validate date is valid
  if (isNaN(dateObj.getTime())) {
    return fallback;
  }

  // Format valid date
  try {
    return format(dateObj, formatStr);
  } catch (error) {
    console.warn('Date formatting error:', error, 'for date:', date);
    return fallback;
  }
}

/**
 * Format a date to relative time (e.g., "2 hours ago")
 * @param date - Date string (ISO) or Date object
 * @returns Relative time string
 */
export function formatTimeAgo(date: string | Date | null | undefined): string {
  if (!date) {
    return '-';
  }

  let dateObj: Date;
  if (typeof date === 'string') {
    if (date.trim() === '') {
      return '-';
    }
    dateObj = parseISO(date);
  } else {
    dateObj = date;
  }

  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  try {
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.warn('Time ago formatting error:', error, 'for date:', date);
    return '-';
  }
}

/**
 * Format a date range for display
 * @param from - Start date (ISO string)
 * @param to - End date (ISO string)
 * @returns Formatted date range string
 */
export function formatDateRange(
  from: string | null | undefined,
  to: string | null | undefined
): string {
  const fromDate = formatDate(from, 'MMM dd', '-');
  const toDate = formatDate(to, 'MMM dd, yyyy', '-');

  if (fromDate === '-' && toDate === '-') {
    return '-';
  }

  return `${fromDate} - ${toDate}`;
}

/**
 * Format a large number with K/M/B suffixes
 * @param value - Number to format
 * @returns Formatted string (e.g., "1.5K", "2.3M")
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Format a date to get the day of week name
 * @param date - Date string (ISO) or Date object
 * @param formatStr - Format string: 'EEEE' for full name (Monday), 'EEE' for abbreviated (Mon)
 * @param fallback - Fallback string for invalid dates (default: '-')
 * @returns Day of week name
 */
export function formatDayName(
  date: string | Date | null | undefined,
  formatStr: 'EEEE' | 'EEE' = 'EEEE',
  fallback: string = '-'
): string {
  if (!date) {
    return fallback;
  }

  let dateObj: Date;
  if (typeof date === 'string') {
    if (date.trim() === '') {
      return fallback;
    }
    dateObj = parseISO(date);
  } else {
    dateObj = date;
  }

  if (isNaN(dateObj.getTime())) {
    return fallback;
  }

  try {
    return format(dateObj, formatStr);
  } catch (error) {
    console.warn('Day name formatting error:', error, 'for date:', date);
    return fallback;
  }
}



