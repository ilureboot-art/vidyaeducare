import { describe, expect, it } from "vitest";
import {
  addCalendarMonths,
  calculateAchievement,
  calculateCommission,
  commissionRateForAchievement,
  countEligibleSales,
  defaultIbaRemunerationPolicy,
  determinePreliminaryEligibility,
  getIndiaWeekRange,
  getTrainingPeriod,
  isInTraining,
  resolveEffectivePolicy,
  validateIbaPolicy,
} from "./iba-remuneration";

const policy = { ...defaultIbaRemunerationPolicy, active: true, status: "PUBLISHED" as const, effectiveFrom: "2026-01-01T00:00:00.000Z" };

describe("IBA remuneration calculations", () => {
  it.each([[25, 100, 10], [20, 80, 10], [19, 76, 5], [0, 0, 5]])("uses policy threshold for %s/25", (sales, achievement, rate) => {
    const actual = calculateAchievement(sales, 25);
    expect(actual).toBe(achievement);
    expect(commissionRateForAchievement(actual, policy)).toBe(rate);
  });

  it("rejects zero targets and invalid financial values", () => {
    const errors = validateIbaPolicy({ ...policy, weeklySalesTarget: 0, standardCommissionPercentage: 101, fixedMonthlyRemuneration: -1 });
    expect(errors).toHaveLength(3);
  });

  it("counts only completed, eligible and non-duplicate sales", () => {
    expect(countEligibleSales([
      { status: "COMPLETED" }, { status: "COMPLETED", duplicate: true },
      { status: "REFUNDED" }, { status: "CANCELLED" }, { status: "FAILED" },
      { status: "COMPLETED", eligible: false },
    ])).toBe(1);
  });

  it("calculates money using the snapshotted rate and split", () => {
    expect(calculateCommission(7200, 10)).toBe(720);
    expect(calculateCommission(7200, 10, 0.5)).toBe(360);
  });

  it("uses calendar months and clamps month-end dates", () => {
    expect(addCalendarMonths(new Date("2026-01-31T10:00:00Z"), 1).toISOString()).toBe("2026-02-28T10:00:00.000Z");
    const training = getTrainingPeriod(new Date("2026-09-15T10:00:00Z"), 1);
    expect(isInTraining(new Date("2026-10-15T09:59:59Z"), training.start, training.endExclusive)).toBe(true);
    expect(isInTraining(training.endExclusive, training.start, training.endExclusive)).toBe(false);
  });

  it("requires management approval after numerical eligibility", () => {
    const base = { paidActive: true, subscriptionActive: true, accountActive: true, trainingCompleted: true, trainingAchievementPercentage: 80 };
    expect(determinePreliminaryEligibility(base, policy)).toBe("ELIGIBLE_PENDING_APPROVAL");
    expect(determinePreliminaryEligibility({ ...base, managementStatus: "APPROVED" }, policy)).toBe("APPROVED");
    expect(determinePreliminaryEligibility({ ...base, subscriptionActive: false }, policy)).toBe("NOT_ELIGIBLE");
    expect(determinePreliminaryEligibility({ ...base, managementStatus: "SUSPENDED" }, policy)).toBe("SUSPENDED");
  });

  it("selects the latest policy effective at the calculation time", () => {
    const future = { ...policy, id: "v3", version: 3, effectiveFrom: "2026-10-01T00:00:00Z" };
    const current = { ...policy, id: "v2", version: 2, effectiveFrom: "2026-09-01T00:00:00Z" };
    expect(resolveEffectivePolicy([future, current], new Date("2026-09-20T00:00:00Z"))?.id).toBe("v2");
  });

  it("uses Monday-to-Monday India week boundaries", () => {
    const range = getIndiaWeekRange(new Date("2026-09-13T20:00:00Z"));
    expect(range.start.toISOString()).toBe("2026-09-13T18:30:00.000Z");
    expect(range.endExclusive.toISOString()).toBe("2026-09-20T18:30:00.000Z");
  });
});
