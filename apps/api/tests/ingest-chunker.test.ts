import { describe, it, expect } from 'vitest';
import { chunkMarkdown, inferCategory } from '../src/services/ingest.service';

describe('ingest chunker', () => {
  it('splits markdown on headings', () => {
    const chunks = chunkMarkdown(
      `# Title\n\n## Fees\n\nFees are flexible.\n\n## Batches\n\nBatches start monthly.`,
      { title: 'Admissions', category: 'admissions', source: 'admissions.md' }
    );
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks.some((c) => c.text.includes('Fees'))).toBe(true);
    expect(chunks.every((c) => c.id.startsWith('chunk_'))).toBe(true);
  });

  it('inferCategory maps filenames', () => {
    expect(inferCategory('courses.md')).toBe('courses');
    expect(inferCategory('faqs.md')).toBe('faq');
    expect(inferCategory('placement_and_training.md')).toBe('placements');
  });
});
