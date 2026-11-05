import { describe, it, expect } from 'vitest';
import app from '../src/index';

describe('API Route Integration Tests', () => {
  const mockEnv = {
    ENVIRONMENT: 'development',
    SESSION_SECRET: 'test_secret_for_hono_api_routes_10k',
    CORS_ORIGIN: '*',
    DB: {
      prepare: (query: string) => ({
        bind: (...args: any[]) => ({
          run: async () => ({ success: true }),
          first: async () => {
            if (query.includes('FROM chat_sessions WHERE id = ?')) {
              return {
                id: args[0],
                token_hash: 'mock_token_hash',
                status: 'active',
                created_at: 1730000000,
                updated_at: 1730000000
              };
            }
            return null;
          },
          all: async () => ({ results: [] })
        })
      })
    } as any,
    AI: {} as any,
    VECTORIZE: {} as any,
    R2: {} as any
  };

  it('GET /api/v1/health returns healthy status', async () => {
    const res = await app.request('/api/v1/health', {}, mockEnv);
    expect(res.status).toBe(200);

    const body = await res.json() as any;
    expect(body.status).toBe('healthy');
    expect(body.service).toBe('10000coders-ai-assistant');
  });

  it('POST /api/v1/sessions creates a new session with signed token', async () => {
    const res = await app.request('/api/v1/sessions', {
      method: 'POST',
      headers: {
        'cf-connecting-ip': '1.2.3.4',
        'user-agent': 'Vitest-Test-Agent'
      }
    }, mockEnv);

    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.status).toBe('success');
    expect(body.data.sessionId).toBeDefined();
    expect(body.data.token).toContain(`${body.data.sessionId}.`);
  });

  it('GET /api/v1/sessions/:id rejects request without Authorization header', async () => {
    const res = await app.request('/api/v1/sessions/test-id-123', {}, mockEnv);
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/sessions/:id rejects request with forged token', async () => {
    const res = await app.request('/api/v1/sessions/test-id-123', {
      headers: {
        'Authorization': 'Bearer test-id-123.forgedsignature1234567890abcdef'
      }
    }, mockEnv);
    expect(res.status).toBe(403);
  });

  it('GET /api/v1/nonexistent returns structured 404', async () => {
    const res = await app.request('/api/v1/nonexistent', {}, mockEnv);
    expect(res.status).toBe(404);
    const body = await res.json() as any;
    expect(body.status).toBe('error');
    expect(body.message).toBe('Route not found');
  });
});

