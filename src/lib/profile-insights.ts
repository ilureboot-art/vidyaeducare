export type ProfileTestResult = {
  id: string;
  studentId: string;
  testId?: string;
  testName?: string;
  score: number;
  rawScore?: number;
  totalQuestions?: number;
  timeTaken?: string;
  date?: string;
  isLive?: boolean;
  accessType?: string;
  rankingEligible?: boolean;
  perTestCashPrizeEligible?: boolean;
  monthlyCashPrizeEligible?: boolean;
};

export function sortProfileTestHistory(results: ProfileTestResult[]) {
  return [...results].sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });
}

export function getProfileAccessSummary(isPaid: boolean) {
  return isPaid
    ? {
        plan: "Paid MockArena Access",
        ranking: "Live paid attempts qualify",
        rewards: "Per-test and monthly prizes eligible",
        tone: "active" as const,
      }
    : {
        plan: "June Free Practice Access",
        ranking: "Not eligible for rankings",
        rewards: "No cash-prize eligibility",
        tone: "practice" as const,
      };
}
