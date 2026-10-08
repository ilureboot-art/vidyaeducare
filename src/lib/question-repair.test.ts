import { describe, it, expect } from 'vitest';
import { proposeQuestionRepair } from './question-repair';
const q = { id: 'Q1', text: { en: 'Question', mr: 'प्रश्न' }, options: { en: ['First', 'Second'], mr: ['पहिला', 'दुसरा'] }, correctAnswer: { en: 'Option B', mr: 'Option B' } };
describe('evidence-preserving question repair', () => {
 it('maps agreeing bilingual option markers without changing order or IDs', () => { const r = proposeQuestionRepair([q]); expect(r.ready).toBe(true); expect(r.questions[0].correctAnswer).toEqual({ en: 'Second', mr: 'दुसरा' }); expect(r.questions[0].options).toEqual(q.options); });
 it('maps documented Marathi markers and language labels', () => { expect(proposeQuestionRepair([{...q, correctAnswer: {en: 'Option B', mr: 'पर्याय ब'}}]).ready).toBe(true); expect(proposeQuestionRepair([{...q, correctAnswer: {en: 'Option B (Eng)', mr: 'Option B (Mar)'}}]).ready).toBe(true); });
 it('rejects contradictory suffixes, keys and missing keys', () => { for (const key of [{ en: 'Option B: First', mr: 'B' }, { en: 'A', mr: 'B' }, { en: 'B', mr: '' }]) expect(proposeQuestionRepair([{ ...q, correctAnswer: key }]).ready).toBe(false); });
 it('uses literal A option before treating it as a marker', () => { expect(proposeQuestionRepair([{ ...q, options: { en: ['Other', 'A'], mr: ['इतर', 'अ'] }, correctAnswer: { en: 'A', mr: 'अ' } }]).ready).toBe(true); });
 it('leaves duplicate choices and translation omissions for review', () => { expect(proposeQuestionRepair([{ ...q, options: { en: ['First', 'First'], mr: ['पहिला', 'पहिला'] } }]).ready).toBe(false); });
 it('normalizes surrounding whitespace but preserves input and rejects repeated IDs', () => { const input = [{ ...q, text: { en: ' Question ', mr: 'प्रश्न' } }]; expect(proposeQuestionRepair(input).questions[0].text.en).toBe('Question'); expect(input[0].text.en).toBe(' Question '); expect(proposeQuestionRepair([q,q]).ready).toBe(false); });
});
