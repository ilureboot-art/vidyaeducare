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

export type StudyGoals = {
  targetAccuracy: number;
  weeklyTests: number;
  focusSubject: string;
  updatedAt?: string;
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

export function getMistakeNotebookSummary(results: ProfileTestResult[]) {
  const attempts = results
    .filter(result => typeof result.rawScore === "number" && typeof result.totalQuestions === "number")
    .map(result => ({ ...result, incorrectAnswers: Math.max(0, (result.totalQuestions || 0) - (result.rawScore || 0)) }))
    .filter(result => result.incorrectAnswers > 0);

  return {
    totalIncorrectAnswers: attempts.reduce((sum, result) => sum + result.incorrectAnswers, 0),
    attempts,
  };
}

export function normalizeStudyGoals(targetAccuracy: number, weeklyTests: number, focusSubject: string): StudyGoals {
  return {
    targetAccuracy: Math.min(100, Math.max(1, Math.round(targetAccuracy || 80))),
    weeklyTests: Math.min(14, Math.max(1, Math.round(weeklyTests || 3))),
    focusSubject: focusSubject.trim().slice(0, 80),
  };
}
