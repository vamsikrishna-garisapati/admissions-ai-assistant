import { describe, it, expect } from 'vitest';
import { parseSimilarityThreshold } from '../src/services/rag.service';
import { buildSystemPromptWithContext, KNOWLEDGE_FALLBACK } from '../src/prompts/admissions';
import { Env, RagSource } from '../src/types';

describe('rag + prompts', () => {
  it('parseSimilarityThreshold defaults to 0.45', () => {
    expect(parseSimilarityThreshold({} as Env)).toBe(0.45);
    expect(parseSimilarityThreshold({ SIMILARITY_SCORE_THRESHOLD: '0.7' } as Env)).toBe(0.7);
  });

  it('buildSystemPromptWithContext includes retrieved chunks', () => {
    const sources: RagSource[] = [
      {
        id: '1',
        score: 0.9,
        title: 'Fees',
        category: 'fees',
        text: 'Course fees vary by programme.'
      }
    ];
    const prompt = buildSystemPromptWithContext(sources);
    expect(prompt).toContain('Course fees vary by programme.');
    expect(prompt).toContain('Do not invent');
  });

  it('buildSystemPromptWithContext without sources asks for fallback behaviour', () => {
    const prompt = buildSystemPromptWithContext([]);
    expect(prompt).toContain('none retrieved');
  });

  it('knowledge fallback matches PRD copy', () => {
    expect(KNOWLEDGE_FALLBACK).toContain('verified information');
    expect(KNOWLEDGE_FALLBACK).toContain('callback');
  });
});
