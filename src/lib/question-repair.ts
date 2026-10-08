import type { Question } from './question-bank';
import { validateQuestionSet } from './server-test-engine';
const stable = (v: any): any => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])])) : v;
const clean = (v: unknown) => typeof v === 'string' ? v.normalize('NFC').trim() : '';
/** Exact text takes precedence over legacy letters. Paired duplicate choices are resolved together below. */
function keyIndex(key: unknown, options: string[]): number | null {
  const value = clean(key);
  const exact = options.flatMap((o, i) => o === value && value ? [i] : []);
  if (exact.length >= 1) return exact[0];
  const marker = value.replace(/^पर्याy\s*/, 'पर्याय ').replace(/\s*\((?:Eng|Mar)\)$/i, '').replace(/^पर्याय\s*([अबकड])$/, (_, c: string) => 'Option ' + ({ अ: 'A', ब: 'B', क: 'C', ड: 'D' } as Record<string,string>)[c]).replace(/^[अबकड]$/, c => ({ अ: 'A', ब: 'B', क: 'C', ड: 'D' } as Record<string,string>)[c]);
  const label = marker.match(/^(?:Option\s*|पर्याय\s*)?([A-H])(?:\s*[:.)-]\s*(.*))?$/i);
  if (!label) return null;
  const index = label[1].toUpperCase().charCodeAt(0) - 65;
  if (index >= options.length || !options[index]) return null;
  if (label[2] && clean(label[2]) !== options[index]) return null;
  return index;
}
export type RepairReview = { questions: Question[]; changed: number; ready: boolean; issues: { questionId: string; reason: string }[] };
/** Formatting repair only: no translation generation, semantic answer inference or question deletion; identical bilingual choices may collapse. */
export function proposeQuestionRepair(input: unknown): RepairReview {
  if (!Array.isArray(input) || !input.length || input.length > 200) return { questions: [], changed: 0, ready: false, issues: [{ questionId: '', reason: 'INVALID_SET_SIZE' }] };
  let changed = 0;
  const issues: RepairReview['issues'] = [];
  const questions = input.map((original): Question => {
    const q: Question = { id: typeof original?.id === 'string' ? original.id : '', text: { en: clean(original?.text?.en), mr: clean(original?.text?.mr) }, options: { en: Array.isArray(original?.options?.en) ? original.options.en.map(clean) : [], mr: Array.isArray(original?.options?.mr) ? original.options.mr.map(clean) : [] }, correctAnswer: { en: clean(original?.correctAnswer?.en), mr: clean(original?.correctAnswer?.mr) } };
    // Both languages must independently identify the same option. One missing key remains for academic review.
    let en = keyIndex(q.correctAnswer.en, q.options.en), mr = keyIndex(q.correctAnswer.mr, q.options.mr);
    // Recognizable CSV column shift: English key contains the complete Marathi stem,
    // while Marathi key contains an exact, unique English choice. Never use arbitrary one-sided keys.
    if (en === null && mr === null && q.text.mr && q.correctAnswer.en === q.text.mr && !q.options.mr.includes(q.correctAnswer.mr)) {
      const shifted = q.options.en.flatMap((o, i) => o === q.correctAnswer.mr && o ? [i] : []);
      if (shifted.length === 1) en = mr = shifted[0];
    }
    if (en !== null && en === mr) q.correctAnswer = { en: q.options.en[en], mr: q.options.mr[en] };
    else issues.push({ questionId: q.id, reason: en !== null && mr !== null ? 'CONFLICTING_LANGUAGE_KEYS' : 'UNRESOLVED_ANSWER_KEY' });
    // Collapse only exactly identical bilingual pairs after resolving the original key index.
    // A duplicated option with a different translation remains invalid for academic review.
    if (en !== null && en === mr && q.options.en.length === q.options.mr.length) {
      const seen = new Set<string>(); const keep = q.options.en.flatMap((option, index) => { const pair = JSON.stringify([option, q.options.mr[index]]); if (seen.has(pair)) return []; seen.add(pair); return [index]; });
      q.options = { en: keep.map(i => q.options.en[i]), mr: keep.map(i => q.options.mr[i]) };
    }
    try { validateQuestionSet([q]); } catch { issues.push({ questionId: q.id, reason: 'FORMAT_OR_TRANSLATION_REVIEW' }); }
    if (JSON.stringify(stable(q)) !== JSON.stringify(stable(original))) changed++;
    return q;
  });
  let ready = false;
  try { validateQuestionSet(questions); ready = issues.length === 0; } catch { if (!issues.length) issues.push({ questionId: '', reason: 'SET_FORMAT_REVIEW' }); }
  return { questions, changed, ready, issues };
}
