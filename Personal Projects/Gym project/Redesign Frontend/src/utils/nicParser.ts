import { format } from 'date-fns';

export interface NICParseResult {
  gender: boolean; // true = male, false = female
  dob: string; // YYYY-MM-DD format
  isValid: boolean;
  error?: string;
}

/**
 * Extract year from old NIC format (2 digits)
 * Uses century logic: if year <= current year's last 2 digits, it's 2000s, otherwise 1900s
 */
function getYearFromOldNIC(yearDigits: string): number {
  const year = parseInt(yearDigits);
  const currentYear = new Date().getFullYear();
  const currentYearLast2 = currentYear % 100;
  
  // If year is <= current year's last 2 digits, it's 2000s
  // Otherwise it's 1900s
  if (year <= currentYearLast2) {
    return 2000 + year;
  } else {
    return 1900 + year;
  }
}

/**
 * Calculate date from day of year
 */
function getDayOfYear(year: number, dayNum: number): Date {
  const date = new Date(year, 0); // January 1st
  date.setDate(dayNum); // Set to the day of year
  return date;
}

/**
 * Parse Sri Lankan NIC number to extract gender and date of birth
 * 
 * Old format (9 digits + V/v/X/x): e.g., 952501234V
 * - Digits 1-2: Year of birth (95 = 1995)
 * - Digits 3-5: Day of year (001-366 for males, 501-866 for females)
 * 
 * New format (12 digits): e.g., 199525012345
 * - Digits 1-4: Full year (1995)
 * - Digits 5-7: Day of year (001-366 for males, 501-866 for females)
 * 
 * @param nic - The NIC number to parse
 * @returns Parsed result with gender, DOB, and validity status
 */
export function parseNIC(nic: string): NICParseResult {
  if (!nic || nic.trim() === '') {
    return { 
      isValid: false, 
      error: 'NIC is empty',
      gender: true,
      dob: ''
    };
  }

  // Validate format
  const oldFormat = /^([0-9]{9})[vVxX]$/;
  const newFormat = /^[0-9]{12}$/;
  
  let year: number;
  let dayOfYear: number;
  let isMale: boolean;
  
  if (oldFormat.test(nic)) {
    // Old format: 952501234V
    const yearDigits = nic.substring(0, 2);
    const dayDigits = parseInt(nic.substring(2, 5));
    
    // Validate day of year range
    if (dayDigits < 1 || (dayDigits > 366 && dayDigits < 501) || dayDigits > 866) {
      return { 
        isValid: false, 
        error: 'Invalid day of year in NIC',
        gender: true,
        dob: ''
      };
    }
    
    year = getYearFromOldNIC(yearDigits);
    
    if (dayDigits > 500) {
      isMale = false;
      dayOfYear = dayDigits - 500;
    } else {
      isMale = true;
      dayOfYear = dayDigits;
    }
  } else if (newFormat.test(nic)) {
    // New format: 199525012345
    year = parseInt(nic.substring(0, 4));
    const dayDigits = parseInt(nic.substring(4, 7));
    
    // Validate day of year range
    if (dayDigits < 1 || (dayDigits > 366 && dayDigits < 501) || dayDigits > 866) {
      return { 
        isValid: false, 
        error: 'Invalid day of year in NIC',
        gender: true,
        dob: ''
      };
    }
    
    // Validate year range (reasonable birth years)
    if (year < 1900 || year > new Date().getFullYear()) {
      return { 
        isValid: false, 
        error: 'Invalid year in NIC',
        gender: true,
        dob: ''
      };
    }
    
    if (dayDigits > 500) {
      isMale = false;
      dayOfYear = dayDigits - 500;
    } else {
      isMale = true;
      dayOfYear = dayDigits;
    }
  } else {
    return { 
      isValid: false, 
      error: 'Invalid NIC format',
      gender: true,
      dob: ''
    };
  }
  
  // Validate day of year is within valid range for the year
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const maxDays = isLeapYear ? 366 : 365;
  
  if (dayOfYear < 1 || dayOfYear > maxDays) {
    return { 
      isValid: false, 
      error: 'Invalid day of year for the given year',
      gender: true,
      dob: ''
    };
  }
  
  // Calculate date from day of year
  try {
    const dobDate = getDayOfYear(year, dayOfYear);
    
    return {
      gender: isMale,
      dob: format(dobDate, 'yyyy-MM-dd'),
      isValid: true
    };
  } catch (error) {
    return { 
      isValid: false, 
      error: 'Error calculating date of birth',
      gender: true,
      dob: ''
    };
  }
}
