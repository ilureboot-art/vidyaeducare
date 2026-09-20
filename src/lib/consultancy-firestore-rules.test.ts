import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const rules = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8"),
  storage = readFileSync(resolve(process.cwd(), "storage.rules"), "utf8");
describe("Consultancy authorization", () => {
  it.each([
    "matrimonialProfiles",
    "consultancyVerifications",
    "matrimonialInterests",
    "matrimonialMeetings",
    "meetingParticipantPayments",
    "marriageMatches",
    "successFeeObligations",
    "counsellingBookings",
    "counsellingDayCounters",
    "ibaMatrimonialCommissionPolicies",
    "ibaMatrimonialReferrals",
    "ibaMatrimonialCommissions",
    "consultancyDocumentVersions",
    "consultancyAcceptances",
    "consultancyComplaints",
    "consultancyAuditLogs",
  ])("protects %s", (name) => expect(rules).toContain(`match /${name}/`));
  it("blocks client writes to sensitive sources of truth", () => {
    for (const name of [
      "matrimonialProfiles",
      "matrimonialMeetings",
      "successFeeObligations",
      "counsellingBookings",
      "consultancyAcceptances",
      "ibaMatrimonialReferrals",
      "ibaMatrimonialCommissions",
    ]) {
      const block = rules.split(`match /${name}/`)[1]?.split("match /")[0];
      expect(block).toContain("allow write: if false");
    }
  });
  it("keeps consultancy files private", () => {
    expect(storage).toContain("match /consultancy/{allPaths=**}");
    expect(storage).toContain("allow read, write: if false");
  });
});
