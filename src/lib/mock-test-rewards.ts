import type { ScheduledTest } from './test-schedule';

export type MockTestAccessType =
  | 'PAID_SUBSCRIPTION'
  | 'JUNE_FREE_PROMOTION'
  | 'TRIAL'
  | 'BACKDATED_PRACTICE'
  | 'ADMIN_COMPLIMENTARY'
  | 'REWARD_FREE_MONTH'
  | 'PURCHASE_REQUIRED';

export type MockTestWindowStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED';

export type MockTestRewardEligibility = {
  accessType: MockTestAccessType;
  testWindowStatus: MockTestWindowStatus;
  rankingEligible: boolean;
  perTestCashPrizeEligible: boolean;
  monthlyCashPrizeEligible: boolean;
  reasonCode:
    | 'ACTIVE_PAID_SUBSCRIPTION'
    | 'UPCOMING_PAID_COMPETITION'
    | 'UNPAID_JUNE_PROMOTION'
    | 'COMPLETED_PRACTICE_ONLY'
    | 'NON_PAID_ACCESS'
    | 'PURCHASE_REQUIRED';
};

export function getMockTestWindowStatus(
  test: Pick<ScheduledTest, 'dateTime' | 'duration'>,
  now = new Date(),
): MockTestWindowStatus {
  const startsAt = new Date(test.dateTime);
  if (Number.isNaN(startsAt.getTime())) return 'COMPLETED';
  const endsAt = new Date(startsAt.getTime() + (test.duration || 30) * 60_000);
  if (now < startsAt) return 'UPCOMING';
  if (now < endsAt) return 'LIVE';
  return 'COMPLETED';
}

/**
 * One source of truth for MockArena competition eligibility.
 * Upcoming paid tests advertise rewards, but an attempt can only be ranked
 * after it is submitted inside the live window. Completed tests are practice.
 */
export function getMockTestRewardEligibility({
  accessType,
  test,
  now = new Date(),
}: {
  accessType: MockTestAccessType;
  test: Pick<ScheduledTest, 'dateTime' | 'duration'>;
  now?: Date;
}): MockTestRewardEligibility {
  const testWindowStatus = getMockTestWindowStatus(test, now);
  const isPaid = accessType === 'PAID_SUBSCRIPTION';

  if (testWindowStatus === 'COMPLETED') {
    return {
      accessType,
      testWindowStatus,
      rankingEligible: false,
      perTestCashPrizeEligible: false,
      monthlyCashPrizeEligible: false,
      reasonCode: 'COMPLETED_PRACTICE_ONLY',
    };
  }

  if (!isPaid) {
    return {
      accessType,
      testWindowStatus,
      rankingEligible: false,
      perTestCashPrizeEligible: false,
      monthlyCashPrizeEligible: false,
      reasonCode:
        accessType === 'JUNE_FREE_PROMOTION'
          ? 'UNPAID_JUNE_PROMOTION'
          : accessType === 'PURCHASE_REQUIRED'
            ? 'PURCHASE_REQUIRED'
            : 'NON_PAID_ACCESS',
    };
  }

  const isLive = testWindowStatus === 'LIVE';
  return {
    accessType,
    testWindowStatus,
    rankingEligible: isLive,
    perTestCashPrizeEligible: isLive,
    monthlyCashPrizeEligible: isLive,
    reasonCode: isLive ? 'ACTIVE_PAID_SUBSCRIPTION' : 'UPCOMING_PAID_COMPETITION',
  };
}

