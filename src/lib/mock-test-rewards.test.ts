import { describe, expect, it } from 'vitest';
import { getMockTestRewardEligibility, getMockTestWindowStatus } from './mock-test-rewards';

const test = { dateTime: '2026-06-15T10:00:00.000Z', duration: 30 };

describe('MockArena paid-only reward eligibility', () => {
  it('marks upcoming paid tests as reward-bearing but not rankable before start', () => {
    const result = getMockTestRewardEligibility({
      accessType: 'PAID_SUBSCRIPTION',
      test,
      now: new Date('2026-06-15T09:00:00.000Z'),
    });
    expect(result.testWindowStatus).toBe('UPCOMING');
    expect(result.reasonCode).toBe('UPCOMING_PAID_COMPETITION');
    expect(result.rankingEligible).toBe(false);
  });

  it('allows ranking and cash prizes for a paid student during June live window', () => {
    const result = getMockTestRewardEligibility({
      accessType: 'PAID_SUBSCRIPTION',
      test,
      now: new Date('2026-06-15T10:15:00.000Z'),
    });
    expect(result.rankingEligible).toBe(true);
    expect(result.perTestCashPrizeEligible).toBe(true);
    expect(result.monthlyCashPrizeEligible).toBe(true);
  });

  it('allows a June unpaid student to practice without ranking or prizes', () => {
    const result = getMockTestRewardEligibility({
      accessType: 'JUNE_FREE_PROMOTION',
      test,
      now: new Date('2026-06-15T10:15:00.000Z'),
    });
    expect(result.reasonCode).toBe('UNPAID_JUNE_PROMOTION');
    expect(result.rankingEligible).toBe(false);
    expect(result.perTestCashPrizeEligible).toBe(false);
    expect(result.monthlyCashPrizeEligible).toBe(false);
  });

  it('never rewards a completed test, even for a paid student', () => {
    const result = getMockTestRewardEligibility({
      accessType: 'PAID_SUBSCRIPTION',
      test,
      now: new Date('2026-06-15T11:00:00.000Z'),
    });
    expect(result.reasonCode).toBe('COMPLETED_PRACTICE_ONLY');
    expect(result.rankingEligible).toBe(false);
    expect(result.perTestCashPrizeEligible).toBe(false);
  });

  it('uses upcoming, live and completed boundaries consistently', () => {
    expect(getMockTestWindowStatus(test, new Date('2026-06-15T09:59:59.999Z'))).toBe('UPCOMING');
    expect(getMockTestWindowStatus(test, new Date('2026-06-15T10:00:00.000Z'))).toBe('LIVE');
    expect(getMockTestWindowStatus(test, new Date('2026-06-15T10:30:00.000Z'))).toBe('COMPLETED');
  });
});

