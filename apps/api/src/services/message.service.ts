import { ChatMessage, Env, MessageRole } from '../types';

export interface InsertMessageInput {
  sessionId: string;
  role: MessageRole;
  content: string;
  sourcesJson?: string | null;
  tokenCount?: number;
}

export async function insertMessage(
  env: Env,
  input: InsertMessageInput
): Promise<ChatMessage> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await env.DB.prepare(
    `INSERT INTO chat_messages (id, session_id, role, content, sources_json, token_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      input.sessionId,
      input.role,
      input.content,
      input.sourcesJson ?? null,
      input.tokenCount ?? 0,
      now
    )
    .run();

  await env.DB.prepare(
    `UPDATE chat_sessions SET updated_at = ? WHERE id = ?`
  )
    .bind(now, input.sessionId)
    .run();

  return {
    id,
    session_id: input.sessionId,
    role: input.role,
    content: input.content,
    sources_json: input.sourcesJson ?? undefined,
    token_count: input.tokenCount ?? 0,
    created_at: now
  };
}

export async function listMessages(
  env: Env,
  sessionId: string
): Promise<ChatMessage[]> {
  const result = await env.DB.prepare(
    `SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC`
  )
    .bind(sessionId)
    .all<ChatMessage>();

  return result.results || [];
}

/**
 * Returns the last N user+assistant turns (each turn = one user + one assistant message pair),
 * flattened chronologically. System messages are excluded from the window.
 */
export async function getRecentHistory(
  env: Env,
  sessionId: string,
  maxTurns: number
): Promise<ChatMessage[]> {
  const messages = await listMessages(env, sessionId);
  const conversational = messages.filter(
    (m) => m.role === 'user' || m.role === 'assistant'
  );

  if (maxTurns <= 0 || conversational.length === 0) {
    return [];
  }

  const maxMessages = maxTurns * 2;
  return conversational.slice(-maxMessages);
}

export function parseMaxChatTurns(env: Env): number {
  const raw = env.MAX_CHAT_TURNS_HISTORY;
  const parsed = raw ? Number.parseInt(raw, 10) : 4;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 4;
}
