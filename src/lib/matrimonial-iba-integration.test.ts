import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const customerApi = readFileSync(
  resolve(process.cwd(), "src/app/api/consultancy/route.ts"),
  "utf8",
);
const adminApi = readFileSync(
  resolve(process.cwd(), "src/app/api/admin/consultancy/route.ts"),
  "utf8",
);
const payoutApi = readFileSync(
  resolve(process.cwd(), "src/app/api/admin/iba/management/route.ts"),
  "utf8",
);
const publicConfigApi = readFileSync(
  resolve(process.cwd(), "src/app/api/consultancy/config/route.ts"),
  "utf8",
);

describe("Matrimonial IBA integration safeguards", () => {
  it("locks an optional verified referral during paid registration", () => {
    expect(customerApi).toContain('attributionStatus: "LOCKED"');
    expect(customerApi).toContain("resolveEligibleIba(referralCode)");
    expect(customerApi).toContain(
      'referralSource: referral ? "IBA_CODE" : "DIRECT"',
    );
  });

  it("creates commission only in the two qualifying payment handlers", () => {
    expect(customerApi).toContain('event: "PROFILE_MEETING"');
    expect(customerApi).toContain('event: "MARRIAGE_FIXED"');
    expect(customerApi).not.toContain('event: "MATRIMONIAL_REGISTRATION"');
    expect(customerApi).toContain("qualifyingPaymentTransactionId");
  });

  it("uses deterministic payment-bound commission IDs", () => {
    expect(customerApi).toContain(
      "commissionRecordId(input.event, input.qualifyingPaymentId)",
    );
    expect(customerApi).toContain("tx.create(ref");
  });

  it("blocks referral reassignment after commission qualification", () => {
    expect(adminApi).toContain(
      "Attribution cannot be reassigned after commission qualification",
    );
    expect(adminApi).toContain("MATRIMONIAL_REFERRAL_OVERRIDDEN");
  });

  it("includes approved matrimonial commissions once in existing payouts", () => {
    expect(payoutApi).toContain("matrimonialCommissionIds");
    expect(payoutApi).toContain("!commission.payoutReference");
    expect(payoutApi).toContain('status: "PAID"');
  });

  it("refunds the official transaction and creates paid-payout adjustment", () => {
    expect(adminApi).toContain("REFUND_MATRIMONIAL_PAYMENT");
    expect(adminApi).toContain('status: "Refunded"');
    expect(adminApi).toContain('recordType: "ADJUSTMENT_REQUIRED"');
    expect(adminApi).toContain('status: "REVERSED"');
  });

  it("keeps inactive counselling services out of customer catalogue", () => {
    expect(publicConfigApi).toContain('.where("enabled", "==", true)');
    expect(adminApi).toContain("SET_SERVICE_STATUS");
    expect(adminApi).toContain("COUNSELLING_SERVICE_DEACTIVATED");
  });

  it("provides an audited Admin Matrimonial service switch", () => {
    expect(adminApi).toContain("SET_MATRIMONIAL_STATUS");
    expect(adminApi).toContain("MATRIMONIAL_SERVICE_DEACTIVATED");
    expect(customerApi).toContain("requireActiveMatrimonialService");
  });
});
