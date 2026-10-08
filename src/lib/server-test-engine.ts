import type { Question } from './question-bank';
import type { MockTestAccessType } from './mock-test-rewards';
import { isFreeMonthMockTest } from './mock-test-access';
import { assertActivationEvidence, StudentActionError } from './student-entitlement';

export type PublicQuestion = Omit<Question, 'correctAnswer'>;
export type AnswerSelections = Record<string, number>;
export class TestEngineError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function validId(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,150}$/.test(value)) throw new TestEngineError('Invalid identifier.');
  return value;
}
export function validateQuestionSet(value: unknown): Question[] {
  if (!Array.isArray(value) || !value.length || value.length > 200) throw new TestEngineError('The question set requires academic review.', 409);
  const ids = new Set<string>();
  return value.map(q => {
    const id = validId(q?.id);
    const text = (s: unknown) => typeof s === 'string' && s.length > 0 && s.length <= 10000;
    if (ids.has(id) || !text(q.text?.en) || !text(q.text?.mr) || !Array.isArray(q.options?.en) || !Array.isArray(q.options?.mr) || q.options.en.length < 2 || q.options.en.length > 8 || q.options.en.length !== q.options.mr.length || !q.options.en.every(text) || !q.options.mr.every(text) || new Set(q.options.en).size !== q.options.en.length || new Set(q.options.mr).size !== q.options.mr.length) throw new TestEngineError('The question set requires academic review.', 409);
    const correct = q.options.en.indexOf(q.correctAnswer?.en);
    if (correct < 0 || q.options.mr[correct] !== q.correctAnswer?.mr) throw new TestEngineError('The answer translations require academic review.', 409);
    ids.add(id);
    return { id, text: { en: q.text.en, mr: q.text.mr }, options: { en: [...q.options.en], mr: [...q.options.mr] }, correctAnswer: { en: q.correctAnswer.en, mr: q.correctAnswer.mr } };
  });
}
export function publicQuestions(questions: Question[]): PublicQuestion[] {
  return questions.map(({ id, text, options }) => ({ id, text, options }));
}
export function normalizeSelections(value: unknown, questions: Question[]): AnswerSelections {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TestEngineError('Invalid answers.');
  const byId = new Map(questions.map(q => [q.id, q]));
  const entries = Object.entries(value);
  if (entries.length > questions.length) throw new TestEngineError('Too many answers.');
  return Object.fromEntries(entries.map(([id, selection]) => {
    const q = byId.get(id);
    if (!q || !Number.isInteger(selection) || Number(selection) < 0 || Number(selection) >= q.options.en.length) throw new TestEngineError('Invalid answer selection.');
    return [id, selection as number];
  }));
}
export function scoreSelections(questions: Question[], answers: AnswerSelections) {
  const rawScore = questions.reduce((n, q) => n + (q.options.en[answers[q.id]] === q.correctAnswer.en ? 1 : 0), 0);
  return { rawScore, totalQuestions: questions.length, score: rawScore / questions.length * 100, answers: Object.fromEntries(Object.entries(answers).map(([id, index]) => {
    const q = questions.find(q => q.id === id)!;
    return [id, { en: q.options.en[index], mr: q.options.mr[index] }];
  })) };
}
export function attemptWindow(test: { dateTime: string; duration: number }, now: number) {
  const startsAt = Date.parse(test.dateTime);
  if (!Number.isFinite(startsAt) || !Number.isInteger(test.duration) || test.duration < 1 || test.duration > 300) throw new TestEngineError('The test schedule requires academic review.', 409);
  if (now < startsAt) throw new TestEngineError('The scheduled test has not started.', 409);
  const windowEnd = startsAt + test.duration * 60000;
  const live = now < windowEnd;
  return { live, windowEnd, deadline: live ? windowEnd : now + test.duration * 60000 };
}
/** Never trust the legacy client-editable paid flag for a server attempt. */
export function verifiedAccess(entitlement: any, order: any, uid: string, test: { dateTime: string }, now: Date): MockTestAccessType {
  if (entitlement?.parentId === uid && entitlement.status === 'ACTIVE') {
    try { return assertActivationEvidence(entitlement, order, uid, now).accessType; }
    catch (error) { if (!(error instanceof StudentActionError)) throw error; }
  }
  if (isFreeMonthMockTest(test)) return 'JUNE_FREE_PROMOTION';
  throw new TestEngineError('An active verified subscription is required. Legacy access needs purchase evidence review.', 403);
}
export function timeString(seconds: number) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
