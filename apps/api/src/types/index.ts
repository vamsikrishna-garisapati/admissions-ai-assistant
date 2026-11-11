export type LeadTier = 'Low intent' | 'Exploring' | 'Interested' | 'High intent';
export type LeadStatus = 'new' | 'qualified' | 'contacted' | 'follow_up' | 'converted' | 'not_interested' | 'closed';
export type SessionStatus = 'active' | 'completed' | 'abandoned';
export type MessageRole = 'system' | 'user' | 'assistant';

export interface ChatSession {
  id: string;
  token_hash: string;
  ip_hash?: string;
  user_agent?: string;
  lead_id?: string;
  status: SessionStatus;
  created_at: number;
  updated_at: number;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  sources_json?: string;
  token_count?: number;
  created_at: number;
}

export interface Lead {
  id: string;
  session_id: string;
  full_name?: string;
  phone_number?: string;
  email?: string;
  qualification?: string;
  graduation_year?: number;
  current_status?: string;
  interested_course?: string;
  career_goal?: string;
  preferred_location?: string;
  learning_mode?: string;
  callback_requested: number;
  preferred_callback_time?: string;
  lead_score: number;
  lead_tier: LeadTier;
  status: LeadStatus;
  notes?: string;
  google_sheet_synced: number;
  created_at: number;
  updated_at: number;
}

export interface LeadSignals {
  askedFees?: boolean;
  askedUpcomingBatches?: boolean;
  askedPlacements?: boolean;
  expressedJoiningInterest?: boolean;
  providedContact?: boolean;
}

export interface ConsentRecord {
  id: string;
  lead_id?: string;
  session_id: string;
  consent_type: 'counselling_callback' | 'marketing_opt_in';
  granted: number;
  ip_hash?: string;
  user_agent?: string;
  consent_text: string;
  created_at: number;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: 'courses' | 'fees' | 'placements' | 'faq' | 'admissions';
  r2_key: string;
  source_url?: string;
  version: number;
  chunk_count: number;
  is_approved: number;
  last_indexed_at: number;
  created_at: number;
}

export interface RagSource {
  id: string;
  score: number;
  title?: string;
  category?: string;
  source?: string;
  text: string;
}

export interface Env {
  ENVIRONMENT: string;
  SESSION_SECRET: string;
  CORS_ORIGIN?: string;
  GOOGLE_SHEETS_WEBHOOK_URL?: string;
  MAX_CHAT_TURNS_HISTORY?: string;
  SIMILARITY_SCORE_THRESHOLD?: string;
  INGEST_SECRET?: string;
  DB: D1Database;
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  R2: R2Bucket;
}

/** Single swap point for the chat LLM. */
export const CHAT_MODEL = '@cf/ibm-granite/granite-4.0-h-micro';
export const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5';

