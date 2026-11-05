import { describe, it, expect } from 'vitest';
import { generateSessionToken, verifySessionToken, hashIp } from '../src/services/session.service';

describe('Session Security Service', () => {
  const secret = 'super_secret_test_key_for_admissions_tests';

  it('generates a signed session token containing sessionId', async () => {
    const sessionId = 'test-session-12345';
    const token = await generateSessionToken(sessionId, secret);
    expect(token).toContain(`${sessionId}.`);
  });

  it('verifies a genuine session token successfully', async () => {
    const sessionId = 'valid-session-uuid';
    const token = await generateSessionToken(sessionId, secret);
    const result = await verifySessionToken(token, secret);

    expect(result.valid).toBe(true);
    expect(result.sessionId).toBe(sessionId);
  });

  it('rejects tampered token with altered signature', async () => {
    const sessionId = 'valid-session-uuid';
    const token = await generateSessionToken(sessionId, secret);
    const tamperedToken = `${token.slice(0, -4)}dead`;

    const result = await verifySessionToken(tamperedToken, secret);
    expect(result.valid).toBe(false);
  });

  it('rejects token signed with a different secret', async () => {
    const sessionId = 'valid-session-uuid';
    const token = await generateSessionToken(sessionId, 'wrong_secret');

    const result = await verifySessionToken(token, secret);
    expect(result.valid).toBe(false);
  });

  it('hashes IP address deterministically and masks raw IP', async () => {
    const ip = '203.0.113.195';
    const hash1 = await hashIp(ip, secret);
    const hash2 = await hashIp(ip, secret);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toContain('203.0.113');
    expect(hash1.length).toBe(16);
  });
});

