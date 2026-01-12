import { z } from 'zod';

// Phone number must be exactly 10 digits (numbers only)
export const phoneSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, '')) // Remove non-digits
  .refine((val) => val.length === 10, {
    message: 'Phone number must be exactly 10 digits',
  });

// Optional phone - allows empty string or valid 10-digit phone
export const optionalPhoneSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ''))
  .refine((val) => val === '' || val.length === 10, {
    message: 'Phone number must be exactly 10 digits',
  });

// Validate phone number (returns error message or null if valid)
export const validatePhone = (phone: string): string | null => {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length === 0) return null; // Empty is allowed for optional fields
  if (digitsOnly.length !== 10) {
    return 'Phone number must be exactly 10 digits';
  }
  return null;
};

// Validate phone number (required - must have exactly 10 digits)
export const validateRequiredPhone = (phone: string): string | null => {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length !== 10) {
    return 'Phone number must be exactly 10 digits';
  }
  return null;
};
