import type { ScheduledTest } from './test-schedule';
import type { MockTestAccessType } from './mock-test-rewards';

export const FREE_MOCK_TEST_MONTH = 6;
export const MOCK_TEST_ACCESS_TIME_ZONE = 'Asia/Kolkata';

export type MockTestAccess = {
  hasAccess: boolean;
  reason: 'subscribed' | 'free-month' | 'purchase-required';
  accessType: MockTestAccessType;
  isPaid: boolean;
};

export function scheduledMonthInIndia(dateTime: string): number | null {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return null;

  const month = new Intl.DateTimeFormat('en-US', {
    timeZone: MOCK_TEST_ACCESS_TIME_ZONE,
    month: 'numeric',
  }).format(date);

  const value = Number(month);
  return Number.isInteger(value) && value >= 1 && value <= 12 ? value : null;
}

export function isFreeMonthMockTest(test: Pick<ScheduledTest, 'dateTime'>): boolean {
  return scheduledMonthInIndia(test.dateTime) === FREE_MOCK_TEST_MONTH;
}

export function getMockTestAccess(
  subscribed: boolean | undefined,
  test: Pick<ScheduledTest, 'dateTime'>,
): MockTestAccess {
  if (subscribed === true) {
    return { hasAccess: true, reason: 'subscribed', accessType: 'PAID_SUBSCRIPTION', isPaid: true };
  }
  if (isFreeMonthMockTest(test)) {
    return { hasAccess: true, reason: 'free-month', accessType: 'JUNE_FREE_PROMOTION', isPaid: false };
  }
  return { hasAccess: false, reason: 'purchase-required', accessType: 'PURCHASE_REQUIRED', isPaid: false };
}
