import { Hono } from 'hono';
import { Env } from '../types';

export const healthRouter = new Hono<{ Bindings: Env }>();

healthRouter.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: '10000coders-ai-assistant',
    version: '1.0.0'
  });
});
