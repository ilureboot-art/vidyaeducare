import {describe,it,expect} from "vitest";
import {approvalAgeHours} from "./approval-inbox";
describe("approval age",()=>{it("handles missing and invalid timestamps",()=>{expect(approvalAgeHours(null)).toBeNull();expect(approvalAgeHours("invalid")).toBeNull();});it("counts whole hours and does not show negative ages",()=>{expect(approvalAgeHours("2026-10-03T00:00:00Z",Date.parse("2026-10-03T03:30:00Z"))).toBe(3);expect(approvalAgeHours("2026-10-04T00:00:00Z",Date.parse("2026-10-03T00:00:00Z"))).toBe(0);});});
