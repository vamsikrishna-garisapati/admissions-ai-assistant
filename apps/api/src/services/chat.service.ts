import {
  CHAT_MODEL,
  Env,
  Lead,
  LeadSignals,
  RagSource
} from '../types';
import {
  buildSystemPromptWithContext,
  formatSourcesForClient,
  KNOWLEDGE_FALLBACK
} from '../prompts/admissions';
import {
  getRecentHistory,
  insertMessage,
  parseMaxChatTurns
} from './message.service';
import { retrieveKnowledge } from './rag.service';
import { detectLeadSignals } from './intent-signals.service';
import { calculateLeadScore } from './lead-scorer.service';

export interface ChatRequest {
  sessionId: string;
  message: string;
  stream: boolean;
  leadId?: string;
}

export interface ChatJsonResult {
  mode: 'json';
  data: {
    reply: string;
    sources: ReturnType<typeof formatSourcesForClient>;
    messageId: string;
    signals: LeadSignals;
    grounded: boolean;
  };
}

export interface ChatSseResult {
  mode: 'sse';
  stream: ReadableStream;
}

export type ChatResult = ChatJsonResult | ChatSseResult;

function sseEncode(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

async function applyLeadSignals(
  env: Env,
  leadId: string | undefined,
  signals: LeadSignals
): Promise<void> {
  if (!leadId) return;

  const hasSignal =
    signals.askedFees ||
    signals.askedUpcomingBatches ||
    signals.askedPlacements ||
    signals.expressedJoiningInterest;

  if (!hasSignal) return;

  const lead = await env.DB.prepare(`SELECT * FROM leads WHERE id = ?`)
    .bind(leadId)
    .first<Lead>();

  if (!lead) return;

  const scoreResult = calculateLeadScore(lead, {
    ...signals,
    providedContact: !!(lead.phone_number && lead.phone_number.length >= 10)
  });

  const now = Math.floor(Date.now() / 1000);
  const status = scoreResult.score >= 50 ? 'qualified' : lead.status;

  await env.DB.prepare(
    `UPDATE leads SET lead_score = ?, lead_tier = ?, status = ?, updated_at = ? WHERE id = ?`
  )
    .bind(scoreResult.score, scoreResult.tier, status, now, leadId)
    .run();

  await env.DB.prepare(
    `INSERT INTO lead_events (id, lead_id, event_type, payload_json, created_at)
     VALUES (?, ?, 'score_updated', ?, ?)`
  )
    .bind(
      crypto.randomUUID(),
      leadId,
      JSON.stringify({
        score: scoreResult.score,
        tier: scoreResult.tier,
        signals,
        breakdown: scoreResult.breakdown
      }),
      now
    )
    .run();
}

export function extractModelText(result: unknown): string {
  if (!result) return '';
  if (typeof result === 'string') return result.trim();

  if (typeof result === 'object') {
    const obj = result as Record<string, unknown>;

    if (typeof obj.response === 'string') return obj.response.trim();
    if (typeof obj.text === 'string') return obj.text.trim();
    if (typeof obj.result === 'string') return obj.result.trim();

    if (Array.isArray(obj.choices) && obj.choices[0]) {
      const choice = obj.choices[0] as Record<string, unknown>;
      if (typeof choice.text === 'string') return choice.text.trim();
      const message = choice.message as Record<string, unknown> | undefined;
      if (message && typeof message.content === 'string') {
        return message.content.trim();
      }
    }

    // Some Workers AI models return { output: [{ type, content: [{ text }] }] }
    if (Array.isArray(obj.output)) {
      const parts: string[] = [];
      for (const item of obj.output as Array<Record<string, unknown>>) {
        if (typeof item.text === 'string') parts.push(item.text);
        if (Array.isArray(item.content)) {
          for (const c of item.content as Array<Record<string, unknown>>) {
            if (typeof c.text === 'string') parts.push(c.text);
          }
        }
      }
      if (parts.length) return parts.join('').trim();
    }
  }

  return '';
}

async function readAiStreamToText(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const parsed = JSON.parse(payload);
        full += extractModelText(parsed) || (parsed as { response?: string }).response || '';
      } catch {
        full += payload;
      }
    }
  }

  return full.trim();
}

async function runNonStreamingReply(
  env: Env,
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const result = await env.AI.run(CHAT_MODEL, {
    messages,
    max_tokens: 512,
    temperature: 0.3
  });

  // Some runtimes return a stream even when stream was omitted
  if (result && typeof result === 'object' && 'getReader' in (result as object)) {
    return readAiStreamToText(result as ReadableStream);
  }

  const text = extractModelText(result);
  if (!text) {
    console.error(
      'Unexpected chat model response shape:',
      typeof result,
      JSON.stringify(result)?.slice(0, 800)
    );
  }
  return text;
}

export async function handleChat(
  env: Env,
  request: ChatRequest
): Promise<ChatResult> {
  const signals = detectLeadSignals(request.message);
  await applyLeadSignals(env, request.leadId, signals);

  await insertMessage(env, {
    sessionId: request.sessionId,
    role: 'user',
    content: request.message
  });

  const history = await getRecentHistory(
    env,
    request.sessionId,
    parseMaxChatTurns(env)
  );

  const { sources, grounded } = await retrieveKnowledge(env, request.message);
  const clientSources = formatSourcesForClient(sources);

  if (!grounded) {
    const assistant = await insertMessage(env, {
      sessionId: request.sessionId,
      role: 'assistant',
      content: KNOWLEDGE_FALLBACK,
      sourcesJson: JSON.stringify([])
    });

    if (!request.stream) {
      return {
        mode: 'json',
        data: {
          reply: KNOWLEDGE_FALLBACK,
          sources: [],
          messageId: assistant.id,
          signals,
          grounded: false
        }
      };
    }

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(
          encoder.encode(sseEncode('sources', { sources: [] }))
        );
        controller.enqueue(
          encoder.encode(sseEncode('token', { text: KNOWLEDGE_FALLBACK }))
        );
        controller.enqueue(
          encoder.encode(
            sseEncode('done', {
              messageId: assistant.id,
              grounded: false,
              signals
            })
          )
        );
        controller.close();
      }
    });

    return { mode: 'sse', stream };
  }

  const systemPrompt = buildSystemPromptWithContext(sources);
  const llmMessages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content }))
  ];

  // History already includes the latest user message we just inserted.
  if (!request.stream) {
    const reply = await runNonStreamingReply(env, llmMessages);
    const finalReply = reply || KNOWLEDGE_FALLBACK;
    const assistant = await insertMessage(env, {
      sessionId: request.sessionId,
      role: 'assistant',
      content: finalReply,
      sourcesJson: JSON.stringify(clientSources)
    });

    return {
      mode: 'json',
      data: {
        reply: finalReply,
        sources: clientSources,
        messageId: assistant.id,
        signals,
        grounded: true
      }
    };
  }

  return {
    mode: 'sse',
    stream: await createChatSseStream(env, {
      sessionId: request.sessionId,
      llmMessages,
      sources,
      clientSources,
      signals
    })
  };
}

async function createChatSseStream(
  env: Env,
  opts: {
    sessionId: string;
    llmMessages: Array<{ role: string; content: string }>;
    sources: RagSource[];
    clientSources: ReturnType<typeof formatSourcesForClient>;
    signals: LeadSignals;
  }
): Promise<ReadableStream> {
  const aiStream = (await env.AI.run(CHAT_MODEL, {
    messages: opts.llmMessages,
    stream: true,
    max_tokens: 512,
    temperature: 0.3
  })) as ReadableStream;

  const reader = aiStream.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(sseEncode('sources', { sources: opts.clientSources }))
      );

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;

            try {
              const parsed = JSON.parse(payload) as {
                response?: string;
                text?: string;
              };
              const token = parsed.response ?? parsed.text ?? '';
              if (!token) continue;
              fullText += token;
              controller.enqueue(
                encoder.encode(sseEncode('token', { text: token }))
              );
            } catch {
              // ignore partial JSON chunks
            }
          }
        }

        const finalReply = fullText.trim() || KNOWLEDGE_FALLBACK;
        const assistant = await insertMessage(env, {
          sessionId: opts.sessionId,
          role: 'assistant',
          content: finalReply,
          sourcesJson: JSON.stringify(opts.clientSources)
        });

        controller.enqueue(
          encoder.encode(
            sseEncode('done', {
              messageId: assistant.id,
              grounded: true,
              signals: opts.signals
            })
          )
        );
        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            sseEncode('error', {
              message: err instanceof Error ? err.message : 'Stream failed'
            })
          )
        );
        controller.close();
      }
    },
    cancel() {
      reader.cancel().catch(() => undefined);
    }
  });
}
