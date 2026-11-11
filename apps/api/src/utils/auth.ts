import { Context } from 'hono';
import { Env } from '../types';
import { verifySessionToken } from '../services/session.service';

export type AuthResult =
  | { ok: true; sessionId: string }
  | { ok: false; status: 401 | 403; message: string };

export async function requireSessionAuth(
  c: Context<{ Bindings: Env }>,
  expectedSessionId?: string
): Promise<AuthResult> {
  const authHeader = c.req.header('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, status: 401, message: 'Missing Authorization header' };
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const auth = await verifySessionToken(token, c.env.SESSION_SECRET);

  if (!auth.valid || !auth.sessionId) {
    return { ok: false, status: 403, message: 'Invalid or expired session token' };
  }

  if (expectedSessionId && auth.sessionId !== expectedSessionId) {
    return { ok: false, status: 403, message: 'Unauthorized session access' };
  }

  return { ok: true, sessionId: auth.sessionId };
}
