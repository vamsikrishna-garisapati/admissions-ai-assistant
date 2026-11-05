import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types';
import { healthRouter } from './routes/health';
import { sessionsRouter } from './routes/sessions';
import { leadsRouter } from './routes/leads';
import { privacyRouter } from './routes/privacy';

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for website frontend
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: (origin) => {
      // In production, match 10000coders.in domains; in dev allow all
      if (!origin || origin.includes('10000coders.in') || origin.includes('localhost')) {
        return origin || '*';
      }
      return c.env.CORS_ORIGIN || '*';
    },
    allowMethods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-RateLimit-Limit'],
    maxAge: 86400
  });
  return corsMiddleware(c, next);
});

// Basic Edge Rate Limiter (Sliding Window in memory per edge isolate)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

app.use('/api/v1/*', async (c, next) => {
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 60; // 60 requests per minute

  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
  } else {
    record.count++;
    if (record.count > maxRequests) {
      return c.json({ status: 'error', message: 'Too many requests. Please slow down.' }, 429);
    }
  }

  // Periodic cleanup of stale entries
  if (rateLimitMap.size > 2000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetAt) rateLimitMap.delete(key);
    }
  }

  await next();
});

// Mount Routes
app.route('/api/v1', healthRouter);
app.route('/api/v1', sessionsRouter);
app.route('/api/v1', leadsRouter);
app.route('/api/v1', privacyRouter);

// 404 handler
app.notFound((c) => {
  return c.json({ status: 'error', message: 'Route not found' }, 404);
});

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled API Error:', err);
  return c.json({
    status: 'error',
    message: c.env.ENVIRONMENT === 'development' ? err.message : 'Internal server error'
  }, 500);
});

export default app;
