import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';
import { verifySessionToken } from '../services/session.service';

export const privacyRouter = new Hono<{ Bindings: Env }>();

const withdrawSchema = z.object({
  phoneNumber: z.string().optional(),
  reason: z.string().max(250).optional()
});

privacyRouter.post('/privacy/withdraw', async (c) => {
  const authHeader = c.req.header('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ status: 'error', message: 'Missing Authorization header' }, 401);
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const auth = await verifySessionToken(token, c.env.SESSION_SECRET);
  if (!auth.valid || !auth.sessionId) {
    return c.json({ status: 'error', message: 'Invalid or expired session token' }, 403);
  }

  const sessionId = auth.sessionId;
  const body = await c.req.json().catch(() => ({}));
  const data = withdrawSchema.parse(body);
  const now = Math.floor(Date.now() / 1000);

  // Record consent withdrawal in consent_records
  await c.env.DB.prepare(
    `INSERT INTO consent_records (id, session_id, consent_type, granted, consent_text, created_at)
     VALUES (?, ?, 'counselling_callback', 0, ?, ?)`
  ).bind(
    crypto.randomUUID(),
    sessionId,
    `Consent withdrawn by user. Reason: ${data.reason || 'Not specified'}`,
    now
  ).run();

  // If there's an associated lead, mark callback as cancelled and status as 'closed'
  await c.env.DB.prepare(
    `UPDATE leads SET callback_requested = 0, status = 'closed', notes = 'Consent withdrawn by prospect', updated_at = ?
     WHERE session_id = ?`
  ).bind(now, sessionId).run();

  return c.json({
    status: 'success',
    message: 'Your consent has been successfully withdrawn. We will not contact you.'
  });
});
