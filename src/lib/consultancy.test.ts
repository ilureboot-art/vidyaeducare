import { describe, expect, it } from "vitest";
import {
  calculateCounsellingPayment,
  calculateFee,
  canTransitionBooking,
  canTransitionMeeting,
  canTransitionSuccessFee,
  defaultConsultancyConfig,
  meetingPaymentId,
  sanitizeMatrimonialProfile,
  successObligationId,
} from "./consultancy";

describe("Life & Relationship Consultancy rules", () => {
  it("calculates default registration, meeting, success and counselling prices", () => {
    expect(
      calculateFee(defaultConsultancyConfig.registrationFee).payableAmount,
    ).toBe(100);
    expect(
      calculateFee(defaultConsultancyConfig.meetingFee).payableAmount,
    ).toBe(50);
    expect(
      calculateFee(defaultConsultancyConfig.successFee).payableAmount,
    ).toBe(5000);
    expect(
      calculateCounsellingPayment(
        { ...defaultConsultancyConfig.registrationFee, regularAmount: 3000 },
        50,
      ),
    ).toMatchObject({
      payableAmount: 1500,
      advanceAmount: 750,
      balanceAmount: 750,
    });
  });
  it("creates independent participant charges for each new meeting", () => {
    expect(meetingPaymentId("meeting1", "a")).not.toBe(
      meetingPaymentId("meeting1", "b"),
    );
    expect(meetingPaymentId("meeting1", "a")).not.toBe(
      meetingPaymentId("meeting2", "a"),
    );
  });
  it("creates independent success obligations", () =>
    expect(successObligationId("match1", "a")).not.toBe(
      successObligationId("match1", "b"),
    ));
  it("never exposes protected contact information in match payloads", () => {
    expect(
      sanitizeMatrimonialProfile(
        {
          displayName: "A",
          city: "Mumbai",
          mobile: "999",
          email: "a@b.com",
          address: "secret",
        },
        ["city"],
      ),
    ).toEqual({ displayName: "A", city: "Mumbai" });
  });
  it("enforces explicit state machines", () => {
    expect(canTransitionMeeting("CONSENT_PENDING", "CONTACT_APPROVED")).toBe(
      false,
    );
    expect(canTransitionMeeting("ADMIN_REVIEW", "CONTACT_APPROVED")).toBe(true);
    expect(canTransitionSuccessFee("DUE", "DISPUTED")).toBe(true);
    expect(canTransitionBooking("CONFIRMED", "RESCHEDULED")).toBe(true);
    expect(canTransitionBooking("CANCELLED", "CONFIRMED")).toBe(false);
  });
});
