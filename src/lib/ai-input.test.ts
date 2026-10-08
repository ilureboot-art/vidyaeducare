import { describe, expect, it, vi } from 'vitest';
vi.mock('@/firebase/admin-init', () => ({ adminAuth: {}, adminDb: {} }));
import { validateAiInput } from './ai-usage';
describe('bounded AI inputs', () => {
  it('accepts bounded academic text and validated images', () => {
    expect(() => validateAiInput({ userDoubt: 'Why?', image: 'data:image/png;base64,YQ==' })).not.toThrow();
  });
  it('rejects external media, malformed image data and unbounded prompts/arrays', () => {
    for (const input of [{ image: 'https://internal.example/image' }, { image: 'data:text/html;base64,YQ==' }, { text: 'a'.repeat(12001) }, { topics: Array(31).fill('topic') }]) expect(() => validateAiInput(input)).toThrow();
  });
});
