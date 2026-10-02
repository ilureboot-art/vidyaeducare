import { describe, expect, it } from "vitest";
import { getMistakeNotebookSummary, getProfileAccessSummary, normalizeStudyGoals, sortProfileTestHistory } from "./profile-insights";

describe("profile insights", () => {
  it("sorts test history newest first", () => {
    const history = sortProfileTestHistory([
      { id: "old", studentId: "s1", score: 60, date: "2026-06-01T10:00:00.000Z" },
      { id: "new", studentId: "s1", score: 90, date: "2026-06-02T10:00:00.000Z" },
    ]);
    expect(history.map(result => result.id)).toEqual(["new", "old"]);
  });

  it("describes paid competition access", () => {
    expect(getProfileAccessSummary(true)).toMatchObject({ plan: "Paid MockArena Access", ranking: "Live paid attempts qualify", tone: "active" });
  });

  it("keeps free users outside rankings and prizes", () => {
    expect(getProfileAccessSummary(false)).toMatchObject({ ranking: "Not eligible for rankings", rewards: "No cash-prize eligibility", tone: "practice" });
  });

  it("summarizes incorrect answers from completed attempts", () => {
    const summary = getMistakeNotebookSummary([
      { id: "a", studentId: "s1", score: 80, rawScore: 8, totalQuestions: 10 },
      { id: "b", studentId: "s1", score: 100, rawScore: 10, totalQuestions: 10 },
    ]);
    expect(summary.totalIncorrectAnswers).toBe(2);
    expect(summary.attempts).toHaveLength(1);
  });

  it("keeps study goals inside supported limits", () => {
    expect(normalizeStudyGoals(120, 0, "  Maths  ")).toEqual({ targetAccuracy: 100, weeklyTests: 3, focusSubject: "Maths" });
  });
});
