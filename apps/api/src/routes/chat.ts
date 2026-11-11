import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';
import { requireSessionAuth } from '../utils/auth';
import { getSession } from '../services/session.service';
import { listMessages } from '../services/message.service';
import { handleChat } from '../services/chat.service';

export const chatRouter = new Hono<{ Bindings: Env }>();

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  stream: z.boolean().default(true)
});

chatRouter.get('/sessions/:id/messages', async (c) => {
  const sessionId = c.req.param('id');
  const auth = await requireSessionAuth(c, sessionId);
  if (!auth.ok) {
    return c.json({ status: 'error', message: auth.message }, auth.status);
  }

  const session = await getSession(c.env, sessionId);
  if (!session) {
    return c.json({ status: 'error', message: 'Session not found' }, 404);
  }

  const messages = await listMessages(c.env, sessionId);
  return c.json({
    status: 'success',
    data: {
      sessionId,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        sources: m.sources_json ? JSON.parse(m.sources_json) : [],
        createdAt: m.created_at
      }))
    }
  });
});

chatRouter.post('/chat', async (c) => {
  const auth = await requireSessionAuth(c);
  if (!auth.ok) {
    return c.json({ status: 'error', message: auth.message }, auth.status);
  }

  const session = await getSession(c.env, auth.sessionId);
  if (!session) {
    return c.json({ status: 'error', message: 'Session not found' }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const parseResult = chatSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ status: 'error', errors: parseResult.error.format() }, 400);
  }

  const { message, stream } = parseResult.data;

  try {
    const result = await handleChat(c.env, {
      sessionId: auth.sessionId,
      message,
      stream,
      leadId: session.lead_id
    });

    if (result.mode === 'sse') {
      return new Response(result.stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive'
        }
      });
    }

    return c.json({
      status: 'success',
      data: result.data
    });
  } catch (err) {
    console.error('Chat error:', err);
    return c.json(
      {
        status: 'error',
        message:
          c.env.ENVIRONMENT === 'development' && err instanceof Error
            ? err.message
            : 'Failed to generate chat response'
      },
      500
    );
  }
});
