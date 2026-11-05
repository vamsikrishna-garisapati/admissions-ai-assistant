import { ChatSession, Env } from '../types';

/**
 * Web Crypto HMAC-SHA256 Token Generator & Verifier
 */
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generateSessionToken(sessionId: string, secret: string): Promise<string> {
  const key = await getCryptoKey(secret);
  const enc = new TextEncoder();
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(`admit_session:${sessionId}`));
  return `${sessionId}.${bufferToHex(signature)}`;
}

export async function verifySessionToken(token: string, secret: string): Promise<{ valid: boolean; sessionId?: string }> {
  if (!token || !token.includes('.')) {
    return { valid: false };
  }

  const [sessionId, hexSignature] = token.split('.');
  if (!sessionId || !hexSignature) {
    return { valid: false };
  }

  const key = await getCryptoKey(secret);
  const enc = new TextEncoder();

  // Convert hex back to bytes
  const sigBytes = new Uint8Array(
    hexSignature.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  );

  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes,
    enc.encode(`admit_session:${sessionId}`)
  );

  return { valid: isValid, sessionId: isValid ? sessionId : undefined };
}

/**
 * Hash IP with session secret for privacy compliance
 */
export async function hashIp(ip: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(`${ip}:${secret}`));
  return bufferToHex(hashBuffer).slice(0, 16);
}

/**
 * Database Session Operations
 */
export async function createSession(
  env: Env,
  clientIp?: string,
  userAgent?: string
): Promise<{ session: ChatSession; token: string }> {
  const sessionId = crypto.randomUUID();
  const token = await generateSessionToken(sessionId, env.SESSION_SECRET);
  const ipHash = clientIp ? await hashIp(clientIp, env.SESSION_SECRET) : undefined;
  const now = Math.floor(Date.now() / 1000);

  // Compute a token hash to store in DB
  const enc = new TextEncoder();
  const tokenHashBuf = await crypto.subtle.digest('SHA-256', enc.encode(token));
  const tokenHash = bufferToHex(tokenHashBuf);

  await env.DB.prepare(
    `INSERT INTO chat_sessions (id, token_hash, ip_hash, user_agent, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'active', ?, ?)`
  ).bind(sessionId, tokenHash, ipHash || null, userAgent || null, now, now).run();

  const session: ChatSession = {
    id: sessionId,
    token_hash: tokenHash,
    ip_hash: ipHash,
    user_agent: userAgent,
    status: 'active',
    created_at: now,
    updated_at: now
  };

  return { session, token };
}

export async function getSession(env: Env, sessionId: string): Promise<ChatSession | null> {
  const result = await env.DB.prepare(
    `SELECT * FROM chat_sessions WHERE id = ?`
  ).bind(sessionId).first<ChatSession>();

  return result || null;
}

