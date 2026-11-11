import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';
import { indexDocuments } from '../services/ingest.service';

export const adminRouter = new Hono<{ Bindings: Env }>();

const reindexSchema = z.object({
  documents: z
    .array(
      z.object({
        title: z.string().min(1),
        category: z.string().min(1),
        source: z.string().min(1),
        content: z.string().min(1)
      })
    )
    .min(1)
});

adminRouter.post('/admin/reindex', async (c) => {
  const expected = c.env.INGEST_SECRET;
  if (!expected) {
    return c.json(
      { status: 'error', message: 'INGEST_SECRET is not configured' },
      503
    );
  }

  const provided = c.req.header('x-ingest-secret');
  if (!provided || provided !== expected) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = reindexSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ status: 'error', errors: parsed.error.format() }, 400);
  }

  try {
    const result = await indexDocuments(c.env, parsed.data.documents);
    return c.json({
      status: 'success',
      data: result
    });
  } catch (err) {
    console.error('Reindex error:', err);
    return c.json(
      {
        status: 'error',
        message:
          c.env.ENVIRONMENT === 'development' && err instanceof Error
            ? err.message
            : 'Reindex failed'
      },
      500
    );
  }
});
