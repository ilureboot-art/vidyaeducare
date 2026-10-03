export type ApprovalItem = { id: string; kind: "payment" | "eligibility" | "payout"; title: string; status: string; createdAt: string | null; amount?: number; actionUrl: string };
export function approvalAgeHours(createdAt: string | null, now = Date.now()): number | null {
 const value = createdAt ? Date.parse(createdAt) : NaN;
 return Number.isFinite(value) ? Math.max(0, Math.floor((now - value) / 3600000)) : null;
}
