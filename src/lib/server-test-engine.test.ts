import { describe, expect, it } from 'vitest';
import { attemptWindow, normalizeSelections, publicQuestions, scoreSelections, validateQuestionSet, verifiedAccess } from './server-test-engine';
const q = { id: 'q1', text: { en: 'Question', mr: 'प्रश्न' }, options: { en: ['A', 'B', 'C', 'D'], mr: ['अ', 'ब', 'क', 'ड'] }, correctAnswer: { en: 'B', mr: 'ब' } };
describe('server test boundaries', () => {
  it('sends no correct answer or injected fields to a candidate', () => {
    const questions = validateQuestionSet([{ ...q, privateExplanation: 'secret' }]);
    expect(publicQuestions(questions)).toEqual([{ id: q.id, text: q.text, options: q.options }]);
    expect(JSON.stringify(publicQuestions(questions))).not.toContain('correctAnswer');
  });
  it('rejects duplicate IDs, answer translation mismatch and ambiguous choices', () => {
    for (const value of [[q, q], [{ ...q, correctAnswer: { en: 'B', mr: 'क' } }], [{ ...q, options: { en: ['A', 'A'], mr: ['अ', 'ब'] } }]]) expect(() => validateQuestionSet(value)).toThrow();
  });
  it('uses canonical indices and rejects score-like fields, unknown IDs and invalid selections', () => {
    for (const value of [{ score: 100 }, { unknown: 1 }, { q1: -1 }, { q1: 4 }, { q1: '1' }]) expect(() => normalizeSelections(value, [q])).toThrow();
    expect(scoreSelections([q], normalizeSelections({ q1: 1 }, [q]))).toMatchObject({ rawScore: 1, score: 100, answers: { q1: { en: 'B', mr: 'ब' } } });
    expect(scoreSelections([q], {})).toMatchObject({ rawScore: 0, score: 0 });
  });
  it('does not extend a live session for a late start and gives completed practice a separate deadline', () => {
    const test = { dateTime: '2026-10-08T10:00:00Z', duration: 30 };
    expect(attemptWindow(test, Date.parse('2026-10-08T10:25:00Z'))).toMatchObject({ live: true, deadline: Date.parse('2026-10-08T10:30:00Z') });
    expect(() => attemptWindow(test, Date.parse('2026-10-08T09:59:00Z'))).toThrow();
    expect(attemptWindow(test, Date.parse('2026-10-08T11:00:00Z'))).toMatchObject({ live: false, deadline: Date.parse('2026-10-08T11:30:00Z') });
  });
  it('does not grant paid access from a boolean or expired/mismatched purchase', () => {
    const date = new Date('2026-10-08'), test = { dateTime: date.toISOString() };
    expect(() => verifiedAccess({ mockTestSubscribed: true }, null, 'owner', test, date)).toThrow();
    const e = { parentId: 'owner', status: 'ACTIVE', accessType: 'PAID_SUBSCRIPTION', productId: 'annual', purchaseTransactionId: 'paid', startsAt: '2026-01-01', expiresAt: '2027-01-01' };
    const order = { user: 'owner', type: 'Purchase', status: 'Completed', amount: -100, finalPrice: 100 };
    expect(verifiedAccess(e, order, 'owner', test, date)).toBe('PAID_SUBSCRIPTION');
    expect(() => verifiedAccess(e, { ...order, user: 'other' }, 'owner', test, date)).toThrow();
    expect(() => verifiedAccess({ ...e, expiresAt: '2026-01-02' }, order, 'owner', test, date)).toThrow();
    expect(verifiedAccess(null, null, 'owner', { dateTime: '2026-06-10' }, date)).toBe('JUNE_FREE_PROMOTION');
  });
});
