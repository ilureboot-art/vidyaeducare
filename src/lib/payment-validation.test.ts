import { describe, expect, it } from 'vitest';
import { normalizeUtr, paymentAmount, walletAfterDecision } from './payment-validation';
import { adminPermissions } from './admin-permissions';
import { rewardReportRow } from './reward-eligibility-report';
describe('payment validation', () => {
  it('rejects invalid money and fractional paise', () => { for (const amount of [NaN, Infinity, -1, 0, '123abc', '', null, 1.001]) expect(() => paymentAmount(amount)).toThrow(); expect(paymentAmount('125.50')).toBe(125.5); });
  it('canonicalizes UTR and rejects malformed input', () => { expect(normalizeUtr(' abc 123 ')).toBe('ABC123'); for (const input of [null, 123, '', 'a', 'abc/123']) expect(() => normalizeUtr(input)).toThrow(); });
  it('retains withdrawal minimum and reserve without refunding rejection', () => { expect(walletAfterDecision(850, -650, 'withdrawal')).toBe(200); expect(() => walletAfterDecision(849, -650, 'withdrawal')).toThrow(); expect(() => walletAfterDecision(1000, -600, 'withdrawal')).toThrow(); expect(walletAfterDecision(100, 50, 'deposit')).toBe(150); expect(() => walletAfterDecision(100, -50, 'deposit')).toThrow(); });
});
describe('admin roles', () => {
  it('never grants pending or unknown administrators permissions', () => { expect(adminPermissions('Head Admin', 'Pending')).toEqual([]); expect(adminPermissions('random', 'Active')).toEqual([]); expect(adminPermissions('Finance Admin', 'Rejected')).toEqual([]); });
  it('separates finance, academics and role administration', () => { expect(adminPermissions('Finance Admin', 'Active')).toContain('payments'); expect(adminPermissions('Academic Admin', 'Active')).not.toContain('payments'); expect(adminPermissions('Sub-admin', 'Active')).not.toContain('roles'); expect(adminPermissions(null, null, true)).toContain('roles'); });
});
describe('paid-only report', () => {
  const live = { accessType: 'PAID_SUBSCRIPTION', subscriptionSnapshot: { isPaid: true }, isLive: true, testWindowStatus: 'LIVE', rankingEligible: true, perTestCashPrizeEligible: true, monthlyCashPrizeEligible: true, date: '2026-06-10T10:00:00Z' };
  it('retains historic paid live June eligibility', () => expect(rewardReportRow('r', live).rankingEligible).toBe(true));
  it('rejects free June, completed practice and missing paid evidence', () => { for (const change of [{ accessType: 'JUNE_FREE_PROMOTION' }, { isLive: false, testWindowStatus: 'COMPLETED' }, { subscriptionSnapshot: {} }]) { const row = rewardReportRow('r', { ...live, ...change }); expect(row.rankingEligible).toBe(false); expect(row.mismatch).toBe(true); } });
});
