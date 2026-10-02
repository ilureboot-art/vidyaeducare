import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const rules = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8");
const notificationRules = rules.split("match /notifications/")[1]?.split("match /")[0] ?? "";

describe("Notification Firestore rule safeguards", () => {
  it("does not expose admin notifications to every signed-in user", () => {
    expect(notificationRules).not.toContain("resource.data.userId == 'admin'");
    expect(notificationRules).toContain("resource.data.userId == request.auth.uid");
  });

  it("does not allow unrestricted notification writes", () => {
    expect(notificationRules).not.toContain("allow write: if true");
    expect(notificationRules).toContain("allow create: if isAdmin()");
  });

  it("only lets a recipient persist the read state", () => {
    expect(notificationRules).toContain("affectedKeys().hasOnly(['status', 'readAt'])");
    expect(notificationRules).toContain("request.resource.data.status == 'read'");
  });
});
