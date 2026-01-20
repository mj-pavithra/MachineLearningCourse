/**
 * Capitalize the first letter of each word in a string
 * Useful for formatting names properly
 * 
 * @param name - The string to capitalize
 * @returns Capitalized string with first letter of each word uppercase
 * 
 * @example
 * capitalizeName("john doe") → "John Doe"
 * capitalizeName("JOHN DOE") → "John Doe"
 * capitalizeName("mc donald") → "Mc Donald"
 */
export function capitalizeName(name: string): string {
  if (!name) return name;
  
  return name
    .trim()
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
