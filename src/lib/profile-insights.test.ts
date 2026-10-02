import { describe, expect, it } from "vitest";
import { getProfileAccessSummary, sortProfileTestHistory } from "./profile-insights";

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
});
