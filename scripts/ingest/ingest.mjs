#!/usr/bin/env node
/**
 * Knowledge ingest CLI
 * Reads knowledge/*.md and POSTs to Worker /api/v1/admin/reindex
 *
 * Usage:
 *   node scripts/ingest/ingest.mjs [--local|--remote] [--url URL]
 *
 * Env:
 *   INGEST_SECRET (default: dev_ingest_secret_change_me)
 *   API_BASE (optional override)
 */
import { readdir, readFile } from 'node:fs/promises';
import { basename, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');
const knowledgeDir = join(root, 'knowledge');

function inferCategory(filename) {
  const name = filename.toLowerCase();
  if (name.includes('course')) return 'courses';
  if (name.includes('fee') || name.includes('admission')) return 'admissions';
  if (name.includes('placement') || name.includes('training')) return 'placements';
  if (name.includes('faq')) return 'faq';
  if (name.includes('campus') || name.includes('contact')) return 'admissions';
  return 'admissions';
}

function titleFromFile(filename) {
  return basename(filename, '.md')
    .split(/[_-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function parseArgs(argv) {
  let url = process.env.API_BASE || 'http://localhost:8787';
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--local') url = 'http://localhost:8787';
    else if (arg === '--remote') {
      url =
        process.env.API_BASE ||
        'https://admissions-ai-assistant.vamsi1681.workers.dev';
    } else if (arg === '--url') {
      url = argv[++i];
    }
  }
  return { url };
}

async function main() {
  const { url } = parseArgs(process.argv);
  const secret =
    process.env.INGEST_SECRET || 'dev_ingest_secret_change_me';

  const files = (await readdir(knowledgeDir)).filter((f) => f.endsWith('.md'));
  if (!files.length) {
    console.error('No markdown files found in knowledge/');
    process.exit(1);
  }

  const documents = [];
  for (const file of files) {
    const content = await readFile(join(knowledgeDir, file), 'utf8');
    documents.push({
      title: titleFromFile(file),
      category: inferCategory(file),
      source: file,
      content
    });
  }

  const endpoint = `${url.replace(/\/$/, '')}/api/v1/admin/reindex`;
  console.log(`Ingesting ${documents.length} documents → ${endpoint}`);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ingest-secret': secret
    },
    body: JSON.stringify({ documents })
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }

  if (!res.ok) {
    console.error('Ingest failed:', res.status, body);
    process.exit(1);
  }

  console.log('Ingest success:', body);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
