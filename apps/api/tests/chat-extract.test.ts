import { describe, it, expect } from 'vitest';
import { extractModelText } from '../src/services/chat.service';

describe('extractModelText', () => {
  it('parses common Workers AI shapes', () => {
    expect(extractModelText({ response: 'Hello' })).toBe('Hello');
    expect(extractModelText({ text: 'Hi' })).toBe('Hi');
    expect(extractModelText('Plain')).toBe('Plain');
    expect(
      extractModelText({
        choices: [{ message: { content: 'From choices' } }]
      })
    ).toBe('From choices');
  });
});
