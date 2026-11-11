import { describe, it, expect } from 'vitest';
import app from '../src/index';
import { generateSessionToken } from '../src/services/session.service';
import { KNOWLEDGE_FALLBACK } from '../src/prompts/admissions';

describe('Chat routes', () => {
  const secret = 'test_secret_for_hono_api_routes_admit';
  const sessionId = '11111111-1111-1111-1111-111111111111';

  function createEnv(overrides: Record<string, any> = {}) {
    const messages: any[] = [];
    return {
      ENVIRONMENT: 'development',
      SESSION_SECRET: secret,
      CORS_ORIGIN: '*',
      MAX_CHAT_TURNS_HISTORY: '4',
      SIMILARITY_SCORE_THRESHOLD: '0.65',
      DB: {
        prepare: (query: string) => ({
          bind: (...args: any[]) => ({
            run: async () => {
              if (query.includes('INSERT INTO chat_messages')) {
                messages.push({
                  id: args[0],
                  session_id: args[1],
                  role: args[2],
                  content: args[3],
                  sources_json: args[4],
                  token_count: args[5],
                  created_at: args[6]
                });
              }
              return { success: true };
            },
            first: async () => {
              if (query.includes('FROM chat_sessions WHERE id = ?')) {
                return {
                  id: args[0],
                  token_hash: 'hash',
                  status: 'active',
                  lead_id: null,
                  created_at: 1730000000,
                  updated_at: 1730000000
                };
              }
              return null;
            },
            all: async () => ({
              results: messages
                .filter((m) => m.session_id === args[0])
                .sort((a, b) => a.created_at - b.created_at)
            })
          })
        })
      } as any,
      AI: {
        run: async (_model: string, input: any) => {
          if (input?.text) {
            return { data: [new Array(768).fill(0.01)] };
          }
          if (input?.stream) {
            const payload = `data: ${JSON.stringify({ response: 'Hello from AI' })}\n\n`;
            return new ReadableStream({
              start(controller) {
                controller.enqueue(new TextEncoder().encode(payload));
                controller.close();
              }
            });
          }
          return { response: 'Hello from AI grounded answer.' };
        }
      } as any,
      VECTORIZE: {
        query: async () => ({ matches: [] })
      } as any,
      R2: {} as any,
      ...overrides
    };
  }

  it('GET /sessions/:id/messages rejects missing auth', async () => {
    const res = await app.request(
      `/api/v1/sessions/${sessionId}/messages`,
      {},
      createEnv()
    );
    expect(res.status).toBe(401);
  });

  it('GET /sessions/:id/messages returns empty list when authorized', async () => {
    const token = await generateSessionToken(sessionId, secret);
    const res = await app.request(
      `/api/v1/sessions/${sessionId}/messages`,
      { headers: { Authorization: `Bearer ${token}` } },
      createEnv()
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.status).toBe('success');
    expect(body.data.messages).toEqual([]);
  });

  it('POST /chat without auth returns 401', async () => {
    const res = await app.request(
      '/api/v1/chat',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hi', stream: false })
      },
      createEnv()
    );
    expect(res.status).toBe(401);
  });

  it('POST /chat JSON returns knowledge fallback when no vector matches', async () => {
    const token = await generateSessionToken(sessionId, secret);
    const res = await app.request(
      '/api/v1/chat',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: 'What are the fees?', stream: false })
      },
      createEnv()
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data.reply).toBe(KNOWLEDGE_FALLBACK);
    expect(body.data.grounded).toBe(false);
    expect(body.data.signals.askedFees).toBe(true);
  });

  it('POST /chat JSON returns grounded reply when vectors match', async () => {
    const token = await generateSessionToken(sessionId, secret);
    const env = createEnv({
      VECTORIZE: {
        query: async () => ({
          matches: [
            {
              id: 'chunk_1',
              score: 0.91,
              metadata: {
                title: 'Fees',
                category: 'fees',
                source: 'admissions_and_fees.md',
                text: 'Course fees depend on the programme. Contact admissions for current pricing.'
              }
            }
          ]
        })
      }
    });

    const res = await app.request(
      '/api/v1/chat',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: 'Tell me about fees', stream: false })
      },
      env
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data.grounded).toBe(true);
    expect(body.data.reply).toContain('Hello from AI');
    expect(body.data.sources[0].id).toBe('chunk_1');
  });

  it('POST /chat stream returns text/event-stream', async () => {
    const token = await generateSessionToken(sessionId, secret);
    const res = await app.request(
      '/api/v1/chat',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: 'Hello', stream: true })
      },
      createEnv()
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    const text = await res.text();
    expect(text).toContain('event: sources');
    expect(text).toContain('event: done');
  });
});
