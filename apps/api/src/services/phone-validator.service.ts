/**
 * Indian Mobile Phone Validator & Normalizer
 * Enforces standard Indian 10-digit mobile phone constraints (starting with 6, 7, 8, or 9).
 */

const BLOCKED_DUMMY_NUMBERS = new Set([
  '9999999999',
  '8888888888',
  '7777777777',
  '6666666666',
  '9876543210',
  '0123456789',
  '1234567890',
  '0000000000'
]);

export interface PhoneValidationResult {
  isValid: boolean;
  normalized?: string; // 10-digit clean string, e.g. "9876543210"
  formatted?: string;  // International format, e.g. "+91 98765 43210"
  error?: string;
}

export function validateAndNormalizeIndianPhone(input: string): PhoneValidationResult {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Strip all non-digit characters
  const rawDigits = input.replace(/\D/g, '');

  let cleaned10 = '';

  // Check prefix variations (+91, 91, 0)
  if (rawDigits.length === 10) {
    cleaned10 = rawDigits;
  } else if (rawDigits.length === 11 && rawDigits.startsWith('0')) {
    cleaned10 = rawDigits.slice(1);
  } else if (rawDigits.length === 12 && rawDigits.startsWith('91')) {
    cleaned10 = rawDigits.slice(2);
  } else {
    return {
      isValid: false,
      error: 'Please enter a valid 10-digit Indian mobile number.'
    };
  }

  // Check valid first digit (6, 7, 8, 9)
  if (!/^[6-9]/.test(cleaned10)) {
    return {
      isValid: false,
      error: 'Indian mobile numbers must start with 6, 7, 8, or 9.'
    };
  }

  // Reject dummy repeating or sequential numbers
  if (BLOCKED_DUMMY_NUMBERS.has(cleaned10)) {
    return {
      isValid: false,
      error: 'Please enter a genuine contact number.'
    };
  }

  return {
    isValid: true,
    normalized: cleaned10,
    formatted: `+91 ${cleaned10.slice(0, 5)} ${cleaned10.slice(5)}`
  };
}
