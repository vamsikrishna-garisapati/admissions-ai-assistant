import { describe, it, expect } from 'vitest';
import { validateAndNormalizeIndianPhone } from '../src/services/phone-validator.service';

describe('Phone Validator Service', () => {
  it('validates clean 10-digit Indian mobile numbers starting with 6-9', () => {
    const res = validateAndNormalizeIndianPhone('9849012345');
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe('9849012345');
    expect(res.formatted).toBe('+91 98490 12345');
  });

  it('handles +91 prefix and spaces', () => {
    const res = validateAndNormalizeIndianPhone('+91 70131 98765');
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe('7013198765');
  });

  it('handles leading 0 prefix', () => {
    const res = validateAndNormalizeIndianPhone('08123456789');
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe('8123456789');
  });

  it('handles 91 without plus prefix', () => {
    const res = validateAndNormalizeIndianPhone('916301234567');
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe('6301234567');
  });

  it('rejects numbers starting with digits < 6', () => {
    const res = validateAndNormalizeIndianPhone('5123456789');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('start with 6, 7, 8, or 9');
  });

  it('rejects numbers with incorrect digit counts', () => {
    expect(validateAndNormalizeIndianPhone('98490123').isValid).toBe(false);
    expect(validateAndNormalizeIndianPhone('9849012345678').isValid).toBe(false);
  });

  it('rejects blocked dummy/fake numbers', () => {
    expect(validateAndNormalizeIndianPhone('9999999999').isValid).toBe(false);
    expect(validateAndNormalizeIndianPhone('9876543210').isValid).toBe(false);
    expect(validateAndNormalizeIndianPhone('1234567890').isValid).toBe(false);
  });
});

