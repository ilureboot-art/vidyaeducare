import { describe, expect, it } from 'vitest';
import { getMockTestAccess, isFreeMonthMockTest, scheduledMonthInIndia } from './mock-test-access';

describe('MCQ scheduled-month access', () => {
  it('makes June tests free for unsubscribed users regardless of test status', () => {
    const completed = { dateTime: '2026-06-01T04:30:00.000Z' };
    const live = { dateTime: '2026-06-15T04:30:00.000Z' };
    const upcoming = { dateTime: '2027-06-30T12:30:00.000Z' };

    expect(getMockTestAccess(false, completed).hasAccess).toBe(true);
    expect(getMockTestAccess(false, live).hasAccess).toBe(true);
    expect(getMockTestAccess(false, upcoming).hasAccess).toBe(true);
  });

  it('requires purchase for every non-June test', () => {
    expect(getMockTestAccess(false, { dateTime: '2026-05-31T12:30:00.000Z' })).toEqual({
      hasAccess: false,
      reason: 'purchase-required',
      accessType: 'PURCHASE_REQUIRED',
      isPaid: false,
    });
    expect(getMockTestAccess(false, { dateTime: '2026-07-01T12:30:00.000Z' }).hasAccess).toBe(false);
  });

  it('always permits subscribed users', () => {
    expect(getMockTestAccess(true, { dateTime: '2026-12-01T04:30:00.000Z' })).toEqual({
      hasAccess: true,
      reason: 'subscribed',
      accessType: 'PAID_SUBSCRIPTION',
      isPaid: true,
    });
  });

  it('uses India time at the June boundary and rejects invalid dates', () => {
    expect(scheduledMonthInIndia('2026-05-31T18:29:59.000Z')).toBe(5);
    expect(scheduledMonthInIndia('2026-05-31T18:30:00.000Z')).toBe(6);
    expect(isFreeMonthMockTest({ dateTime: 'not-a-date' })).toBe(false);
  });
});
