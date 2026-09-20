import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const rules = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8");

describe("IBA Firestore rule safeguards", () => {
  it.each([
    "ibaRemunerationPolicies", "ibaPolicyHistory", "ibaSales", "ibaPerformance",
    "ibaEligibility", "ibaPayouts", "ibaPayoutHistory", "ibaFixedRemunerationClaims",
  ])("defines protection for %s", (collection) => {
    expect(rules).toContain(`match /${collection}/`);
  });

  it("prevents clients from writing financial source-of-truth records", () => {
    for (const collection of ["ibaSales", "ibaPerformance", "ibaEligibility", "ibaPayouts", "ibaPayoutHistory"]) {
      const block = rules.split(`match /${collection}/`)[1]?.split("match /")[0];
      expect(block).toContain("allow write: if false");
    }
  });

  it("prevents owners from editing remuneration-sensitive user fields", () => {
    expect(rules).toContain("'commission_rate'");
    expect(rules).toContain("'purchasedMockTest'");
    expect(rules).toContain("'managementApprovalStatus'");
  });

  it("removes unrestricted client writes from referral sales", () => {
    const block = rules.split("match /clients/")[1]?.split("match /")[0];
    expect(block).not.toContain("allow write: if true");
  });
});
