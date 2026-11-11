import { EMBEDDING_MODEL, Env } from '../types';
import { embedTexts } from './rag.service';

export interface KnowledgeDocInput {
  title: string;
  category: string;
  source: string;
  content: string;
}

export interface KnowledgeChunk {
  id: string;
  title: string;
  category: string;
  source: string;
  text: string;
}

/** Split markdown on ## / ### headings; soft-split long sections. */
export function chunkMarkdown(
  content: string,
  meta: { title: string; category: string; source: string },
  maxChars = 1800
): KnowledgeChunk[] {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const sections = normalized.split(/\n(?=#{2,3}\s)/);
  const chunks: KnowledgeChunk[] = [];

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    if (trimmed.length <= maxChars) {
      chunks.push(makeChunk(trimmed, meta, chunks.length));
      continue;
    }

    const paragraphs = trimmed.split(/\n\n+/);
    let buffer = '';
    for (const para of paragraphs) {
      if ((buffer + '\n\n' + para).trim().length > maxChars && buffer) {
        chunks.push(makeChunk(buffer.trim(), meta, chunks.length));
        buffer = para;
      } else {
        buffer = buffer ? `${buffer}\n\n${para}` : para;
      }
    }
    if (buffer.trim()) {
      chunks.push(makeChunk(buffer.trim(), meta, chunks.length));
    }
  }

  return chunks;
}

function makeChunk(
  text: string,
  meta: { title: string; category: string; source: string },
  index: number
): KnowledgeChunk {
  const id = stableId(`${meta.source}::${index}::${text.slice(0, 64)}`);
  return {
    id,
    title: meta.title,
    category: meta.category,
    source: meta.source,
    text
  };
}

function stableId(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `chunk_${(hash >>> 0).toString(16)}`;
}

export function inferCategory(filename: string): string {
  const name = filename.toLowerCase();
  if (name.includes('course')) return 'courses';
  if (name.includes('fee') || name.includes('admission')) return 'admissions';
  if (name.includes('placement') || name.includes('training')) return 'placements';
  if (name.includes('faq')) return 'faq';
  if (name.includes('campus') || name.includes('contact')) return 'admissions';
  return 'admissions';
}

export async function indexDocuments(
  env: Env,
  documents: KnowledgeDocInput[]
): Promise<{ documentCount: number; chunkCount: number }> {
  const allChunks: KnowledgeChunk[] = [];

  for (const doc of documents) {
    const chunks = chunkMarkdown(doc.content, {
      title: doc.title,
      category: doc.category,
      source: doc.source
    });
    allChunks.push(...chunks);

    const r2Key = `knowledge/${doc.source}`;
    await env.R2.put(r2Key, doc.content, {
      httpMetadata: { contentType: 'text/markdown; charset=utf-8' }
    });

    const now = Math.floor(Date.now() / 1000);
    const docId = stableId(doc.source);

    await env.DB.prepare(
      `INSERT INTO knowledge_documents (
        id, title, category, r2_key, source_url, version, chunk_count, is_approved, last_indexed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, 1, ?, 1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        category = excluded.category,
        r2_key = excluded.r2_key,
        chunk_count = excluded.chunk_count,
        last_indexed_at = excluded.last_indexed_at`
    )
      .bind(
        docId,
        doc.title,
        doc.category,
        r2Key,
        doc.source,
        chunks.length,
        now,
        now
      )
      .run();

    // Replace chunk rows for this source
    await env.DB.prepare(`DELETE FROM knowledge_chunks WHERE source = ?`)
      .bind(doc.source)
      .run();

    for (const chunk of chunks) {
      await env.DB.prepare(
        `INSERT INTO knowledge_chunks (id, document_id, title, category, source, text, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          chunk.id,
          docId,
          chunk.title,
          chunk.category,
          chunk.source,
          chunk.text,
          now
        )
        .run();
    }
  }

  // Embed + upsert in batches of 20
  const batchSize = 20;
  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);
    const vectors = await embedTexts(
      env,
      batch.map((c) => c.text)
    );

    await env.VECTORIZE.upsert(
      batch.map((chunk, idx) => ({
        id: chunk.id,
        values: vectors[idx],
        metadata: {
          title: chunk.title,
          category: chunk.category,
          source: chunk.source,
          // Short preview only; full text lives in D1 knowledge_chunks
          text: chunk.text.slice(0, 500)
        }
      }))
    );
  }

  return {
    documentCount: documents.length,
    chunkCount: allChunks.length
  };
}

export { EMBEDDING_MODEL };
