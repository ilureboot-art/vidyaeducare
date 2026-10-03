type Result = Record<string, any>;
export function rewardReportRow(id: string, result: Result) {
  const paid = result.accessType === 'PAID_SUBSCRIPTION' && result.subscriptionSnapshot?.isPaid === true;
  const live = result.isLive === true && result.testWindowStatus === 'LIVE';
  const eligible = paid && live && result.rankingEligible === true && result.perTestCashPrizeEligible === true && result.monthlyCashPrizeEligible === true;
  const reason = eligible ? 'PAID_LIVE_ATTEMPT' : !paid ? 'UNPAID_OR_MISSING_PAID_SNAPSHOT' : !live ? 'PRACTICE_OR_NON_LIVE_ATTEMPT' : 'INCOMPLETE_ELIGIBILITY_FLAGS';
  const mismatch = !eligible && (result.rankingEligible === true || result.perTestCashPrizeEligible === true || result.monthlyCashPrizeEligible === true);
  return { id, studentId: result.studentId || '', testId: result.testId || '', date: result.date || '', accessType: result.accessType || 'UNKNOWN', rankingEligible: eligible, perTestCashPrizeEligible: eligible, monthlyCashPrizeEligible: eligible, reason, mismatch };
}
