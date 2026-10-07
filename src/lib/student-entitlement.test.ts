import { describe, expect, it } from 'vitest';
import { assertActivationEvidence, normalizeStudentInput, activationClaimId } from './student-entitlement';
import { getMockTestAccess } from './mock-test-access';
const voucher = { parentId: 'owner', purchaseTransactionId: 'order', productId: 'annual', accessType: 'PAID_SUBSCRIPTION', startsAt: '2026-01-01T00:00:00Z', expiresAt: '2027-01-01T00:00:00Z' };
const order = { user: 'owner', type: 'Purchase', status: 'Completed', amount: -100, finalPrice: 100 };
describe('trusted student activation evidence', () => {
  it('requires completed matching purchase evidence, never a paid boolean or old code list', () => {
    expect(() => assertActivationEvidence(undefined, order, 'owner')).toThrow();
    for (const change of [{ user: 'other' }, { status: 'Rejected' }, { amount: 100 }, { finalPrice: 101 }]) expect(() => assertActivationEvidence(voucher, { ...order, ...change }, 'owner')).toThrow();
    expect(assertActivationEvidence(voucher, order, 'owner', new Date('2026-10-01'))).toMatchObject({ verifiedPaid: true, accessType: 'PAID_SUBSCRIPTION' });
  });
  it('denies expired or future access and excludes complimentary access from paid eligibility', () => {
    expect(() => assertActivationEvidence(voucher, order, 'owner', new Date('2027-01-01'))).toThrow();
    expect(() => assertActivationEvidence(voucher, order, 'owner', new Date('2025-01-01'))).toThrow();
    expect(assertActivationEvidence({ ...voucher, accessType: 'ADMIN_COMPLIMENTARY' }, { ...order, amount: 0, finalPrice: 0 }, 'owner', new Date('2026-10-01')).verifiedPaid).toBe(false);
  });
  it('binds claims to owners and strips forged registration fields', () => {
    expect(activationClaimId('owner', 'code')).not.toBe(activationClaimId('other', 'code'));
    const input = normalizeStudentInput({ name: 'Student', dob: '2010-01-01', parentId: 'other', mockTestSubscribed: true, stats: { totalEarnings: 9999 }, academic: { board: 'SSC', standard: '10', subjects: ['Maths'] } });
    expect(input).not.toHaveProperty('parentId'); expect(input).not.toHaveProperty('mockTestSubscribed'); expect(input).not.toHaveProperty('stats');
    expect(() => normalizeStudentInput({ ...input, academic: { ...input.academic, subjects: ['x'.repeat(101)] } })).toThrow();
  });
  it('enforces verified entitlement expiry and keeps complimentary access outside cash ranking', () => {
    const e = assertActivationEvidence(voucher, order, 'owner', new Date('2026-10-01'));
    expect(getMockTestAccess(true, { dateTime: '2026-10-01' }, e, new Date('2027-01-01')).hasAccess).toBe(false);
    expect(getMockTestAccess(true, { dateTime: '2026-10-01' }, { ...e, accessType: 'ADMIN_COMPLIMENTARY', verifiedPaid: false }, new Date('2026-10-01'))).toMatchObject({ hasAccess: true, isPaid: false, accessType: 'ADMIN_COMPLIMENTARY' });
  });
});
