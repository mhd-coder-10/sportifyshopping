/**
 * Format a price in INR (Indian Rupee)
 * @param price - The price in INR
 * @returns Formatted price string with ₹ symbol
 */
export const formatPrice = (price: number): string => {
  return `₹${price.toFixed(2)}`;
};
