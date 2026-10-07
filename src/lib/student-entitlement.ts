import { createHash } from 'node:crypto';

export class StudentActionError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export const activationClaimId = (uid: string, code: string) => createHash('sha256').update(`${uid}:${code}`).digest('hex');
export function normalizeStudentInput(value: any) {
  const text = (v: unknown, max: number) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max ? v.trim() : null;
  const name = text(value?.name, 120), dob = text(value?.dob, 10);
  const academic = value?.academic;
  if (!name || !dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob) || !Number.isFinite(Date.parse(dob)) || new Date(dob).toISOString().slice(0, 10) !== dob || new Date(dob) > new Date()) throw new StudentActionError('Enter a valid student name and date of birth.');
  if (!academic || !['CBSE', 'ICSE', 'SSC'].includes(academic.board) || !text(academic.standard, 40)) throw new StudentActionError('Enter a valid board and standard.');
  const subjects = normalizeSubjects(academic.subjects);
  return { name, dob, academic: { board: academic.board, standard: academic.standard.trim(), stream: typeof academic.stream === 'string' ? academic.stream.slice(0, 80) : '', language: typeof academic.language === 'string' ? academic.language.slice(0, 40) : 'English', academicYear: typeof academic.academicYear === 'string' ? academic.academicYear.slice(0, 30) : '', subjects } };
}
export function normalizeSubjects(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 30 || value.some(v => typeof v !== 'string' || !v.trim() || v.length > 100)) throw new StudentActionError('Select at most 30 valid subjects.');
  return [...new Set(value.map(v => v.trim()))];
}
export function assertActivationEvidence(voucher: any, order: any, uid: string, now = new Date()) {
  if (!voucher || voucher.parentId !== uid || typeof voucher.productId !== 'string' || !voucher.productId || !order || order.user !== uid || order.type !== 'Purchase' || order.status !== 'Completed' || voucher.purchaseTransactionId == null) throw new StudentActionError('This code requires verified purchase evidence. Contact support.', 409);
  const expiresAt = voucher.expiresAt?.toDate ? voucher.expiresAt.toDate() : new Date(voucher.expiresAt);
  const startsAt = voucher.startsAt?.toDate ? voucher.startsAt.toDate() : new Date(voucher.startsAt);
  if (!Number.isFinite(expiresAt.getTime()) || !Number.isFinite(startsAt.getTime()) || startsAt > now || expiresAt <= now) throw new StudentActionError('This subscription code is expired or not yet active.', 409);
  const paid = voucher.accessType === 'PAID_SUBSCRIPTION';
  if (paid && !(Number(order.amount) < 0 && Number(order.finalPrice) > 0 && -Number(order.amount) === Number(order.finalPrice))) throw new StudentActionError('Paid purchase evidence is inconsistent. Contact support.', 409);
  if (!['PAID_SUBSCRIPTION', 'ADMIN_COMPLIMENTARY'].includes(voucher.accessType)) throw new StudentActionError('Unsupported access type.', 409);
  return { version: 1, accessType: voucher.accessType, productId: voucher.productId, purchaseTransactionId: voucher.purchaseTransactionId, startsAt: startsAt.toISOString(), expiresAt: expiresAt.toISOString(), status: 'ACTIVE', verifiedPaid: paid };
}
