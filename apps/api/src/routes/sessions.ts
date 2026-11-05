import { Hono } from 'hono';
import { Env } from '../types';
import { createSession, getSession, verifySessionToken } from '../services/session.service';

export const sessionsRouter = new Hono<{ Bindings: Env }>();

sessionsRouter.post('/sessions', async (c) => {
  const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1';
  const userAgent = c.req.header('user-agent') || 'Unknown';

  const { session, token } = await createSession(c.env, clientIp, userAgent);

  return c.json({
    status: 'success',
    data: {
      sessionId: session.id,
      token,
      status: session.status,
      createdAt: session.created_at
    }
  }, 201);
});

sessionsRouter.get('/sessions/:id', async (c) => {
  const sessionId = c.req.param('id');
  const authHeader = c.req.header('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ status: 'error', message: 'Missing or malformed Authorization header' }, 401);
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const verification = await verifySessionToken(token, c.env.SESSION_SECRET);

  if (!verification.valid || verification.sessionId !== sessionId) {
    return c.json({ status: 'error', message: 'Unauthorized session access' }, 403);
  }

  const session = await getSession(c.env, sessionId);
  if (!session) {
    return c.json({ status: 'error', message: 'Session not found' }, 404);
  }

  return c.json({
    status: 'success',
    data: {
      sessionId: session.id,
      status: session.status,
      leadId: session.lead_id,
      createdAt: session.created_at,
      updatedAt: session.updated_at
    }
  });
});
