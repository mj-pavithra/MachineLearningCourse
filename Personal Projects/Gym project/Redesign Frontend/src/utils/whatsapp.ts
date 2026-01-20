/**
 * Formats a phone number for WhatsApp URL
 * Removes spaces, dashes, parentheses, and ensures it starts with country code
 * 
 * @param phoneNumber - The phone number to format (e.g., "0768150618", "+94768150618", "076-815-0618")
 * @returns Formatted phone number for WhatsApp URL (e.g., "94768150618")
 */
export function formatPhoneForWhatsApp(phoneNumber: string | null | undefined): string | null {
  if (!phoneNumber) return null;
  
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  if (digitsOnly.length === 0) return null;
  
  // If it starts with 0, replace with country code 94 (Sri Lanka)
  // If it doesn't start with a country code, assume it's a local number and add 94
  let formatted = digitsOnly;
  if (formatted.startsWith('0')) {
    formatted = '94' + formatted.substring(1);
  } else if (!formatted.startsWith('94')) {
    // If it doesn't start with 94, assume it's a local number and add 94
    formatted = '94' + formatted;
  }
  
  return formatted;
}

/**
 * Creates a WhatsApp URL for a phone number
 * 
 * @param phoneNumber - The phone number to format
 * @returns WhatsApp URL (e.g., "https://wa.me/94768150618")
 */
export function getWhatsAppUrl(phoneNumber: string | null | undefined): string | null {
  const formatted = formatPhoneForWhatsApp(phoneNumber);
  if (!formatted) return null;
  return `https://wa.me/${formatted}`;
}

/**
 * Opens WhatsApp with a pre-filled message
 * 
 * @param phoneNumber - The phone number to message
 * @param message - Optional pre-filled message
 */
export function openWhatsApp(phoneNumber: string | null | undefined, message?: string): void {
  const formatted = formatPhoneForWhatsApp(phoneNumber);
  if (!formatted) return;
  
  let url = `https://wa.me/${formatted}`;
  if (message) {
    const encodedMessage = encodeURIComponent(message);
    url += `?text=${encodedMessage}`;
  }
  
  window.open(url, '_blank');
}

