# AI Admissions Assistant

An intelligent, 24/7 digital admissions counselor for prospective students. The assistant guides candidates through course options, training methodologies, batch schedules, fees, and placement support using Retrieval-Augmented Generation (RAG). It progressively captures leads and dispatches qualified callback requests in real time to **Google Sheets**.

---

## Architecture Overview

- **Runtime:** Cloudflare Workers (TypeScript + Hono)
- **Database:** Cloudflare D1 (SQLite engine for sessions, message history, leads, consent audit trail)
- **Vector Search:** Cloudflare Vectorize (768-dimensional embeddings via `@cf/baai/bge-base-en-v1.5`)
- **LLM Inference:** Cloudflare Workers AI (`@cf/ibm-granite/granite-4.0-h-micro`)
- **Embeddings:** `@cf/baai/bge-base-en-v1.5` (768-d) into Vectorize
- **Knowledge Store:** Cloudflare R2 (`admissions-docs`)
- **Admissions Dispatch:** Google Sheets via Google Apps Script Webhook
- **Frontend Widget:** Lightweight React/Next.js widget with Server-Sent Events (SSE) streaming (planned)

---

## Directory Structure

```text
├── apps/
│   └── api/                    # Cloudflare Worker Backend API
│       ├── migrations/         # D1 SQL schemas (sessions, leads, events, consent)
│       ├── src/
│       │   ├── routes/         # Hono routes (health, sessions, leads, privacy, chat)
│       │   ├── services/       # Scorer, phone validator, session HMAC, sheets sync
│       │   └── types/          # TypeScript interfaces & Cloudflare bindings
│       ├── tests/              # Vitest test suite (phone, score, session security)
│       └── wrangler.toml       # Cloudflare Worker configuration & resource bindings
├── packages/
│   └── widget/                 # Next.js / React embeddable chatbot widget
├── scripts/
│   ├── google-sheets/          # One-click Google Apps Script receiver (Code.gs)
│   └── ingest/                 # Offline markdown RAG chunker & Vectorize indexer
└── PRD.md                      # Product Requirements Document
```

---

## Quickstart & Local Development

### 1. Prerequisites
- Node.js >= 20
- `pnpm` >= 9
- Cloudflare CLI: `wrangler`

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Run Automated Tests
```bash
pnpm test
```

### 4. Apply Local D1 Database Migrations
```bash
cd apps/api
pnpm d1:migrate:local
```

### 5. Start Local Worker Dev Server
```bash
pnpm dev:api
```
The API will be live at `http://localhost:8787/api/v1`.

### 6. Ingest Knowledge Base (RAG)
Vectorize + Workers AI need Cloudflare network access, so prefer ingesting against the **deployed** Worker:
```bash
INGEST_SECRET=dev_ingest_secret_change_me pnpm ingest:remote
```
`INGEST_SECRET` must match the Worker var/secret (`dev_ingest_secret_change_me` in `wrangler.toml`; override in production with `wrangler secret put INGEST_SECRET`).

Local-only ingest (`pnpm ingest`) requires a running `wrangler dev` with working AI/Vectorize bindings (Wrangler 3 may leave Vectorize undefined locally).

### Chat API (quick check)
```bash
# Create a session, then:
curl -s -X POST http://localhost:8787/api/v1/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Which courses do you offer?","stream":false}'
```
- `POST /api/v1/chat` — JSON (`stream:false`) or SSE (`stream:true`, default)
- `GET /api/v1/sessions/:id/messages` — conversation history

---

## Google Sheets Integration Setup (5 Minutes)

1. Open [Google Sheets](https://sheets.new) and name the spreadsheet: **"AI Admissions Leads"**.
2. Go to **Extensions > Apps Script**.
3. Copy the contents of `scripts/google-sheets/Code.gs` and paste it into the editor.
4. Select `setupHeaders` from the dropdown and click **Run** (formats headers with `#1a365d` styling).
5. Click **Deploy > New Deployment**:
   - Select type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the generated Web App URL.
7. Set the URL as an environment secret in `apps/api`:
   ```bash
   wrangler secret put GOOGLE_SHEETS_WEBHOOK_URL
   ```
   *(Or set `GOOGLE_SHEETS_WEBHOOK_URL` in `apps/api/wrangler.toml` for local dev)*

---

## Lead Scoring Rules (Deterministic)

Leads are deterministically scored (0–100) using business rules (no LLM hallucination):
- Interested in specific course: `+10`
- Shared education / graduation year: `+10`
- Inquired about fees: `+10`
- Inquired about upcoming batches: `+15`
- Inquired about placement support: `+10`
- Expressed joining interest: `+20`
- Requested counselor callback: `+20`
- Validated contact number provided: `+5`

**Tiers:**
- `0–24`: Low intent
- `25–49`: Exploring
- `50–74`: Interested (Auto-qualified)
- `75–100`: High intent (Urgent callback)
