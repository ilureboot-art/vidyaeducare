export type MatrimonialCommissionEvent = "PROFILE_MEETING" | "MARRIAGE_FIXED";

export type MatrimonialCommissionRule = {
  enabled: boolean;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minimumQualifyingPayment: number;
  maximumCommission: number | null;
  payoutTiming: "WEEKLY" | "MANUAL";
  refundRule: "REVERSE_BEFORE_PAYOUT_ADJUST_AFTER_PAYOUT";
};

export type MatrimonialCommissionPolicy = {
  id?: string;
  version: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  active: boolean;
  effectiveFrom: string;
  effectiveUntil: string | null;
  profileMeeting: MatrimonialCommissionRule;
  marriageFixed: MatrimonialCommissionRule;
};

export const defaultMatrimonialCommissionPolicy: MatrimonialCommissionPolicy = {
  version: 1,
  status: "DRAFT",
  active: false,
  effectiveFrom: new Date(0).toISOString(),
  effectiveUntil: null,
  profileMeeting: {
    enabled: false,
    type: "PERCENTAGE",
    value: 0,
    minimumQualifyingPayment: 0,
    maximumCommission: null,
    payoutTiming: "WEEKLY",
    refundRule: "REVERSE_BEFORE_PAYOUT_ADJUST_AFTER_PAYOUT",
  },
  marriageFixed: {
    enabled: false,
    type: "PERCENTAGE",
    value: 0,
    minimumQualifyingPayment: 0,
    maximumCommission: null,
    payoutTiming: "WEEKLY",
    refundRule: "REVERSE_BEFORE_PAYOUT_ADJUST_AFTER_PAYOUT",
  },
};

export function validateMatrimonialCommissionPolicy(
  policy: MatrimonialCommissionPolicy,
) {
  const errors: string[] = [];
  for (const [name, rule] of [
    ["Profile Meeting", policy.profileMeeting],
    ["Marriage Fixed", policy.marriageFixed],
  ] as const) {
    if (!Number.isFinite(rule.value) || rule.value < 0)
      errors.push(`${name} commission value cannot be negative.`);
    if (rule.type === "PERCENTAGE" && rule.value > 100)
      errors.push(`${name} percentage cannot exceed 100%.`);
    if (
      !Number.isFinite(rule.minimumQualifyingPayment) ||
      rule.minimumQualifyingPayment < 0
    )
      errors.push(`${name} minimum qualifying payment is invalid.`);
    if (
      rule.maximumCommission !== null &&
      (!Number.isFinite(rule.maximumCommission) || rule.maximumCommission < 0)
    )
      errors.push(`${name} maximum commission is invalid.`);
  }
  if (Number.isNaN(new Date(policy.effectiveFrom).getTime()))
    errors.push("A valid effective date is required.");
  if (
    policy.effectiveUntil &&
    new Date(policy.effectiveUntil) <= new Date(policy.effectiveFrom)
  )
    errors.push("Effective-until must be after effective-from.");
  return errors;
}

export function calculateMatrimonialCommission(
  qualifyingAmount: number,
  rule: MatrimonialCommissionRule,
) {
  if (!rule.enabled || qualifyingAmount < rule.minimumQualifyingPayment)
    return 0;
  const raw =
    rule.type === "FIXED" ? rule.value : (qualifyingAmount * rule.value) / 100;
  const capped =
    rule.maximumCommission === null
      ? raw
      : Math.min(raw, rule.maximumCommission);
  return Math.round(Math.max(0, capped) * 100) / 100;
}

export function commissionRecordId(
  event: MatrimonialCommissionEvent,
  qualifyingPaymentId: string,
) {
  return `${event.toLowerCase()}_${qualifyingPaymentId}`;
}

export function isPolicyEffective(
  policy: MatrimonialCommissionPolicy,
  at: Date,
) {
  return (
    policy.active &&
    policy.status === "PUBLISHED" &&
    new Date(policy.effectiveFrom) <= at &&
    (!policy.effectiveUntil || at < new Date(policy.effectiveUntil))
  );
}
