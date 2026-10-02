import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const route = readFileSync(
  new URL("../app/api/admin/iba/management/route.ts", import.meta.url),
  "utf8",
);
const userNotifications = readFileSync(
  new URL("../components/UserNotifications.tsx", import.meta.url),
  "utf8",
);

describe("IBA lifecycle notifications", () => {
  it("notifies the affected IBA about eligibility and remuneration decisions", () => {
    expect(route).toContain('type: "iba_eligibility_updated"');
    expect(route).toContain('type: "iba_remuneration_updated"');
    expect(route).toContain('actionUrl: "/iba/dashboard"');
  });

  it("notifies the IBA for each audited payout status", () => {
    expect(route).toContain('type: "iba_payout_updated"');
    for (const status of ["PENDING_REVIEW", "APPROVED", "PAID", "ON_HOLD", "REJECTED"])
      expect(route).toContain(`${status}:`);
    expect(route).toContain('actionUrl: "/iba/earnings"');
  });

  it("renders notification deep links for users", () => {
    expect(userNotifications).toContain('href={notif.actionUrl || "/profile"}');
  });
});
