import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const rules = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8");
const storage = readFileSync(resolve(process.cwd(), "storage.rules"), "utf8");

describe("StoryTeller authorization safeguards", () => {
  it.each(["storytellerProjects", "storytellerOrders", "storytellerJobs", "storytellerPurchaseRequests", "storytellerConfigHistory"])("protects %s", collection => expect(rules).toContain(`match /${collection}/`));
  it("blocks client mutation of projects, orders and jobs", () => {
    for (const name of ["storytellerProjects", "storytellerOrders", "storytellerJobs"]) {
      const block=rules.split(`match /${name}/`)[1]?.split("match /")[0]; expect(block).toContain("allow write: if false");
    }
  });
  it("keeps user output assets private", () => {
    expect(storage).toContain("match /storyteller/{allPaths=**}");
    expect(storage).toContain("allow read, write: if false");
  });
});
