-- 1. Chat Sessions (Visitor conversation sessions)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL,
    ip_hash TEXT,
    user_agent TEXT,
    lead_id TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_sessions_lead ON chat_sessions(lead_id);
CREATE INDEX IF NOT EXISTS idx_sessions_updated ON chat_sessions(updated_at DESC);

-- 2. Chat Messages (Full turn history)
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
    content TEXT NOT NULL,
    sources_json TEXT, -- JSON array of retrieved chunk metadata
    token_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id, created_at ASC);

-- 3. Leads (Structured prospective student leads)
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES chat_sessions(id),
    full_name TEXT,
    phone_number TEXT,
    email TEXT,
    qualification TEXT,
    graduation_year INTEGER,
    current_status TEXT, -- e.g. 'Fresher', 'Working Professional', 'Final Year Student'
    interested_course TEXT, -- e.g. 'Full Stack Python', 'MERN Stack', 'Data Engineering'
    career_goal TEXT,
    preferred_location TEXT, -- e.g. 'Hyderabad', 'Bangalore', 'Online'
    learning_mode TEXT, -- 'Online', 'Offline', 'Hybrid'
    callback_requested INTEGER DEFAULT 0,
    preferred_callback_time TEXT,
    lead_score INTEGER DEFAULT 0,
    lead_tier TEXT DEFAULT 'Low intent' CHECK (lead_tier IN ('Low intent', 'Exploring', 'Interested', 'High intent')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'qualified', 'contacted', 'follow_up', 'converted', 'not_interested', 'closed')),
    notes TEXT,
    google_sheet_synced INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone_number);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(lead_score DESC);

-- 4. Lead Events (Audit log for lifecycle events)
CREATE TABLE IF NOT EXISTS lead_events (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'created', 'score_updated', 'callback_requested', 'status_changed', 'synced'
    payload_json TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_lead_events_lead ON lead_events(lead_id);

-- 5. Consent Records (DPDP Act & Privacy compliance audit trail)
CREATE TABLE IF NOT EXISTS consent_records (
    id TEXT PRIMARY KEY,
    lead_id TEXT REFERENCES leads(id),
    session_id TEXT NOT NULL,
    consent_type TEXT NOT NULL, -- 'counselling_callback', 'marketing_opt_in'
    granted INTEGER NOT NULL CHECK (granted IN (0, 1)),
    ip_hash TEXT,
    user_agent TEXT,
    consent_text TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_consent_session ON consent_records(session_id);

-- 6. Knowledge Documents Metadata (Tracking indexed docs)
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- 'courses', 'fees', 'placements', 'faq', 'admissions'
    r2_key TEXT NOT NULL,
    source_url TEXT,
    version INTEGER DEFAULT 1,
    chunk_count INTEGER NOT NULL DEFAULT 0,
    is_approved INTEGER DEFAULT 1,
    last_indexed_at INTEGER NOT NULL DEFAULT (unixepoch()),
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_documents(category);

