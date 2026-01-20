/**
 * Format phone number to international format (+94)
 * Converts local Sri Lankan format (07XXXXXXXX) to international (+947XXXXXXXX)
 * 
 * @param phone - The phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return phone;
  
  // Remove any spaces, dashes, or special characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // If starts with 0 and is 10 digits, convert to +94
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '+94' + cleaned.substring(1);
  }
  
  // If already starts with 94 and is 11 digits (without +), add +
  if (cleaned.startsWith('94') && cleaned.length === 11 && !cleaned.startsWith('+')) {
    return '+' + cleaned;
  }
  
  // If already starts with +94, return as is
  if (cleaned.startsWith('+94')) {
    return cleaned;
  }
  
  // Otherwise return cleaned version
  return cleaned;
}

/**
 * Normalize phone number for display/editing
 * Converts international format (+947XXXXXXXX) back to local (07XXXXXXXX)
 * 
 * @param phone - The phone number to normalize
 * @returns Normalized phone number for display
 */
export function normalizePhoneForDisplay(phone: string): string {
  if (!phone) return phone;
  
  // Convert +94711606520 back to 0711606520 for display/editing
  if (phone.startsWith('+94') && phone.length === 12) {
    return '0' + phone.substring(3);
  }
  
  // If starts with 94 (without +) and is 11 digits, convert to local
  if (phone.startsWith('94') && phone.length === 11 && !phone.startsWith('+')) {
    return '0' + phone.substring(2);
  }
  
  return phone;
}
