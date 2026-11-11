import { describe, it, expect } from 'vitest';
import {
  getRecentHistory,
  insertMessage,
  listMessages,
  parseMaxChatTurns
} from '../src/services/message.service';
import { Env } from '../src/types';

function createMockDb(store: Map<string, any[]>) {
  return {
    prepare: (query: string) => ({
      bind: (...args: any[]) => ({
        run: async () => {
          if (query.includes('INSERT INTO chat_messages')) {
            const messages = store.get('messages') || [];
            messages.push({
              id: args[0],
              session_id: args[1],
              role: args[2],
              content: args[3],
              sources_json: args[4],
              token_count: args[5],
              created_at: args[6]
            });
            store.set('messages', messages);
          }
          return { success: true };
        },
        first: async () => null,
        all: async () => {
          if (query.includes('FROM chat_messages')) {
            const messages = (store.get('messages') || []).filter(
              (m) => m.session_id === args[0]
            );
            return { results: messages };
          }
          return { results: [] };
        }
      })
    })
  } as any;
}

describe('message.service', () => {
  it('parseMaxChatTurns defaults to 4 and clamps invalid values', () => {
    expect(parseMaxChatTurns({ MAX_CHAT_TURNS_HISTORY: undefined } as Env)).toBe(4);
    expect(parseMaxChatTurns({ MAX_CHAT_TURNS_HISTORY: '6' } as Env)).toBe(6);
    expect(parseMaxChatTurns({ MAX_CHAT_TURNS_HISTORY: '0' } as Env)).toBe(4);
    expect(parseMaxChatTurns({ MAX_CHAT_TURNS_HISTORY: 'abc' } as Env)).toBe(4);
  });

  it('insertMessage and listMessages persist conversational turns', async () => {
    const store = new Map<string, any[]>();
    const env = { DB: createMockDb(store) } as Env;

    const user = await insertMessage(env, {
      sessionId: 'sess-1',
      role: 'user',
      content: 'What courses do you offer?'
    });
    const assistant = await insertMessage(env, {
      sessionId: 'sess-1',
      role: 'assistant',
      content: 'We offer Full Stack Python and MERN.',
      sourcesJson: JSON.stringify([{ id: 'c1' }])
    });

    expect(user.id).toBeDefined();
    expect(assistant.sources_json).toContain('c1');

    const listed = await listMessages(env, 'sess-1');
    expect(listed).toHaveLength(2);
    expect(listed[0].role).toBe('user');
    expect(listed[1].role).toBe('assistant');
  });

  it('getRecentHistory returns only the last N turns', async () => {
    const store = new Map<string, any[]>();
    const env = { DB: createMockDb(store) } as Env;

    for (let i = 1; i <= 5; i++) {
      await insertMessage(env, {
        sessionId: 'sess-1',
        role: 'user',
        content: `user-${i}`
      });
      await insertMessage(env, {
        sessionId: 'sess-1',
        role: 'assistant',
        content: `assistant-${i}`
      });
    }

    const recent = await getRecentHistory(env, 'sess-1', 2);
    expect(recent).toHaveLength(4);
    expect(recent[0].content).toBe('user-4');
    expect(recent[3].content).toBe('assistant-5');
  });
});
