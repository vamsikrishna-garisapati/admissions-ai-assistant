-- Store chunk text for RAG hydration (Vectorize holds vectors + short metadata)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    source TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_chunks_source ON knowledge_chunks(source);
CREATE INDEX IF NOT EXISTS idx_chunks_document ON knowledge_chunks(document_id);
