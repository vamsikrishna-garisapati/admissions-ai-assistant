import { EMBEDDING_MODEL, Env, RagSource } from '../types';

export interface EmbeddingResponse {
  shape?: number[];
  data: number[][];
}

export function parseSimilarityThreshold(env: Env): number {
  const raw = env.SIMILARITY_SCORE_THRESHOLD;
  const parsed = raw ? Number.parseFloat(raw) : 0.45;
  return Number.isFinite(parsed) ? parsed : 0.45;
}

export async function embedTexts(env: Env, texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const response = (await env.AI.run(EMBEDDING_MODEL, {
    text: texts
  })) as EmbeddingResponse;

  if (!response?.data || !Array.isArray(response.data)) {
    throw new Error('Embedding model returned no vector data');
  }

  return response.data;
}

export async function retrieveKnowledge(
  env: Env,
  query: string,
  topK = 5
): Promise<{ sources: RagSource[]; grounded: boolean }> {
  const threshold = parseSimilarityThreshold(env);
  const [queryVector] = await embedTexts(env, [query]);

  if (!queryVector) {
    return { sources: [], grounded: false };
  }

  if (!env.VECTORIZE) {
    throw new Error('VECTORIZE binding is not configured');
  }

  const matches = await env.VECTORIZE.query(queryVector, {
    topK,
    returnMetadata: 'all'
  });

  const candidates = (matches.matches || []).filter(
    (m) => typeof m.score === 'number' && m.score >= threshold
  );

  const sources: RagSource[] = [];
  for (const m of candidates) {
    const meta = (m.metadata || {}) as Record<string, unknown>;
    let text = typeof meta.text === 'string' ? meta.text : '';

    if (!text.trim()) {
      const row = await env.DB.prepare(
        `SELECT text, title, category, source FROM knowledge_chunks WHERE id = ?`
      )
        .bind(m.id)
        .first<{ text: string; title: string; category: string; source: string }>();
      if (row?.text) {
        text = row.text;
        sources.push({
          id: m.id,
          score: m.score ?? 0,
          title: row.title,
          category: row.category,
          source: row.source,
          text
        });
        continue;
      }
    }

    if (!text.trim()) continue;

    sources.push({
      id: m.id,
      score: m.score ?? 0,
      title: typeof meta.title === 'string' ? meta.title : undefined,
      category: typeof meta.category === 'string' ? meta.category : undefined,
      source: typeof meta.source === 'string' ? meta.source : undefined,
      text
    });
  }

  return {
    sources,
    grounded: sources.length > 0
  };
}

export function formatContextForPrompt(sources: RagSource[]): string {
  return sources.map((s) => s.text).join('\n\n---\n\n');
}
