import { describe, expect, it } from "vitest";
import {
  calculateMatrimonialCommission,
  commissionRecordId,
  defaultMatrimonialCommissionPolicy,
  isPolicyEffective,
  validateMatrimonialCommissionPolicy,
} from "./matrimonial-iba-commission";

describe("IBA matrimonial commission", () => {
  it("calculates percentage, fixed and capped commission", () => {
    const base = defaultMatrimonialCommissionPolicy.profileMeeting;
    expect(
      calculateMatrimonialCommission(5000, {
        ...base,
        enabled: true,
        type: "PERCENTAGE",
        value: 10,
      }),
    ).toBe(500);
    expect(
      calculateMatrimonialCommission(95, {
        ...base,
        enabled: true,
        type: "FIXED",
        value: 20,
      }),
    ).toBe(20);
    expect(
      calculateMatrimonialCommission(5000, {
        ...base,
        enabled: true,
        value: 10,
        maximumCommission: 300,
      }),
    ).toBe(300);
  });

  it("does not create value for disabled or under-minimum rules", () => {
    const base = defaultMatrimonialCommissionPolicy.profileMeeting;
    expect(calculateMatrimonialCommission(100, base)).toBe(0);
    expect(
      calculateMatrimonialCommission(99, {
        ...base,
        enabled: true,
        type: "FIXED",
        value: 20,
        minimumQualifyingPayment: 100,
      }),
    ).toBe(0);
  });

  it("uses a deterministic ID per qualifying payment", () => {
    expect(commissionRecordId("PROFILE_MEETING", "payment-a")).toBe(
      "profile_meeting_payment-a",
    );
    expect(commissionRecordId("PROFILE_MEETING", "payment-a")).toBe(
      commissionRecordId("PROFILE_MEETING", "payment-a"),
    );
  });

  it("honours policy boundaries and rejects invalid percentages", () => {
    const policy = {
      ...defaultMatrimonialCommissionPolicy,
      active: true,
      status: "PUBLISHED" as const,
      effectiveFrom: "2026-01-01T00:00:00.000Z",
      effectiveUntil: "2026-02-01T00:00:00.000Z",
    };
    expect(isPolicyEffective(policy, new Date("2026-01-15"))).toBe(true);
    expect(isPolicyEffective(policy, new Date("2026-02-01"))).toBe(false);
    expect(
      validateMatrimonialCommissionPolicy({
        ...policy,
        profileMeeting: { ...policy.profileMeeting, value: 101 },
      }),
    ).toContain("Profile Meeting percentage cannot exceed 100%.");
  });
});
