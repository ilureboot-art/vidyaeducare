export const INDIA_TIME_ZONE = "Asia/Kolkata";

export type PolicyStatus = "DRAFT" | "PUBLISHED" | "INACTIVE";
export type PayoutFrequency = "WEEKLY" | "MONTHLY";
export type IbaEligibilityStatus =
  | "TRAINING"
  | "TRAINING_COMPLETED"
  | "ELIGIBLE_PENDING_APPROVAL"
  | "APPROVED"
  | "NOT_ELIGIBLE"
  | "SUSPENDED";

export type IbaRemunerationPolicy = {
  id?: string;
  title: string;
  version: number;
  status: PolicyStatus;
  active: boolean;
  fixedMonthlyRemuneration: number;
  standardCommissionPercentage: number;
  reducedCommissionPercentage: number;
  weeklySalesTarget: number;
  minimumAchievementPercentage: number;
  trainingPeriodMonths: number;
  trainingCommissionOnly: boolean;
  payoutFrequency: PayoutFrequency;
  paidActiveIbaRequired: boolean;
  requiredProductId: string;
  requiredProductName: string;
  monthlyTrainingTarget: number;
  managementApprovalRequired: boolean;
  recruitmentTitle: string;
  recruitmentBenefits: string[];
  earningOpportunityEnabled: boolean;
  earningOpportunityText: string;
  earningOpportunityDisclaimer: string;
  termsAndConditions: string;
  disclaimer: string;
  effectiveFrom: string;
  createdAt?: unknown;
  createdBy?: string;
  updatedAt?: unknown;
  updatedBy?: string;
  publishedAt?: unknown;
  publishedBy?: string;
};

export type EligibleSaleStatus =
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED"
  | "FAILED";

export type SaleEligibilityInput = {
  status: EligibleSaleStatus;
  duplicate?: boolean;
  eligible?: boolean;
};

export const defaultIbaRemunerationPolicy: IbaRemunerationPolicy = {
  title: "Vidya Educare – IBA Remuneration Policy",
  version: 1,
  status: "DRAFT",
  active: false,
  fixedMonthlyRemuneration: 10000,
  standardCommissionPercentage: 10,
  reducedCommissionPercentage: 5,
  weeklySalesTarget: 25,
  minimumAchievementPercentage: 80,
  trainingPeriodMonths: 1,
  trainingCommissionOnly: true,
  payoutFrequency: "WEEKLY",
  paidActiveIbaRequired: true,
  requiredProductId: "mock-arena-annual",
  requiredProductName: "Vidya Educare Mock Test Annual Subscription",
  monthlyTrainingTarget: 100,
  managementApprovalRequired: true,
  recruitmentTitle: "Become a Vidya Educare Independent Business Associate",
  recruitmentBenefits: [
    "No fixed working hours",
    "Flexible work",
    "Work from home / work from anywhere",
    "Performance-based earning opportunity",
    "Weekly payout structure",
    "Commission-based earning opportunity",
    "Opportunity for eligible IBAs to receive Fixed Monthly Remuneration",
  ],
  earningOpportunityEnabled: false,
  earningOpportunityText: "Opportunity to earn ₹25,000–₹30,000 weekly.",
  earningOpportunityDisclaimer:
    "Illustrative/performance-based earning opportunity only. Actual earnings depend on eligible sales, applicable commission rates, performance, policy eligibility and management approval. No income is guaranteed.",
  termsAndConditions: "Eligibility and payouts are subject to the published policy and management review.",
  disclaimer: "An IBA is an independent business associate and not an employee. Fixed Monthly Remuneration is not a salary and is not guaranteed.",
  effectiveFrom: "",
};

export function validateIbaPolicy(policy: IbaRemunerationPolicy): string[] {
  const errors: string[] = [];
  if (!policy.title.trim()) errors.push("Policy title is required.");
  if (!Number.isInteger(policy.version) || policy.version < 1) errors.push("Policy version must be a positive integer.");
  if (!Number.isFinite(policy.fixedMonthlyRemuneration) || policy.fixedMonthlyRemuneration < 0) errors.push("Fixed monthly remuneration cannot be negative.");
  if (!Number.isFinite(policy.weeklySalesTarget) || policy.weeklySalesTarget <= 0) errors.push("Weekly sales target must be greater than zero.");
  if (!Number.isFinite(policy.monthlyTrainingTarget) || policy.monthlyTrainingTarget <= 0) errors.push("Monthly training target must be greater than zero.");
  if (!Number.isInteger(policy.trainingPeriodMonths) || policy.trainingPeriodMonths < 1) errors.push("Training period must be at least one complete month.");
  for (const [label, value] of [
    ["Standard commission", policy.standardCommissionPercentage],
    ["Reduced commission", policy.reducedCommissionPercentage],
    ["Minimum achievement", policy.minimumAchievementPercentage],
  ] as const) {
    if (!Number.isFinite(value) || value < 0 || value > 100) errors.push(`${label} percentage must be between 0 and 100.`);
  }
  if (policy.reducedCommissionPercentage > policy.standardCommissionPercentage) errors.push("Reduced commission cannot exceed standard commission.");
  if (policy.paidActiveIbaRequired && (!policy.requiredProductId.trim() || !policy.requiredProductName.trim())) errors.push("A required subscription/product must be selected.");
  if (policy.status === "PUBLISHED" && !isValidDate(policy.effectiveFrom)) errors.push("A valid effective date is required before publishing.");
  if (policy.earningOpportunityEnabled && !policy.earningOpportunityDisclaimer.trim()) errors.push("A disclaimer is required when the earning opportunity claim is enabled.");
  return errors;
}

export function calculateAchievement(successfulSales: number, target: number): number {
  if (!Number.isFinite(target) || target <= 0) return 0;
  return Math.max(0, successfulSales) / target * 100;
}

export function commissionRateForAchievement(achievement: number, policy: IbaRemunerationPolicy): number {
  return achievement >= policy.minimumAchievementPercentage
    ? policy.standardCommissionPercentage
    : policy.reducedCommissionPercentage;
}

export function countEligibleSales(sales: SaleEligibilityInput[]): number {
  return sales.filter((sale) => sale.status === "COMPLETED" && sale.eligible !== false && sale.duplicate !== true).length;
}

export function calculateCommission(salesAmount: number, rate: number, splitFactor = 1): number {
  if (salesAmount <= 0 || rate < 0 || splitFactor <= 0) return 0;
  return roundMoney(salesAmount * rate / 100 * splitFactor);
}

export function addCalendarMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

export function getTrainingPeriod(joiningDate: Date, months: number) {
  const start = new Date(joiningDate.getTime());
  const endExclusive = addCalendarMonths(start, months);
  return { start, endExclusive };
}

export function isInTraining(at: Date, trainingStart: Date, trainingEndExclusive: Date): boolean {
  return at >= trainingStart && at < trainingEndExclusive;
}

export function determinePreliminaryEligibility(input: {
  paidActive: boolean;
  subscriptionActive: boolean;
  accountActive: boolean;
  trainingCompleted: boolean;
  trainingAchievementPercentage: number;
  managementStatus?: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
}, policy: IbaRemunerationPolicy): IbaEligibilityStatus {
  if (input.managementStatus === "SUSPENDED" || !input.accountActive) return "SUSPENDED";
  if (!input.trainingCompleted) return "TRAINING";
  if ((policy.paidActiveIbaRequired && !input.paidActive) || !input.subscriptionActive || input.trainingAchievementPercentage < policy.minimumAchievementPercentage) return "NOT_ELIGIBLE";
  if (input.managementStatus === "APPROVED") return "APPROVED";
  if (input.managementStatus === "REJECTED") return "NOT_ELIGIBLE";
  return policy.managementApprovalRequired ? "ELIGIBLE_PENDING_APPROVAL" : "APPROVED";
}

export function resolveEffectivePolicy(policies: IbaRemunerationPolicy[], at: Date): IbaRemunerationPolicy | null {
  return policies
    .filter((policy) => policy.active && policy.status === "PUBLISHED" && isValidDate(policy.effectiveFrom) && new Date(policy.effectiveFrom) <= at)
    .sort((a, b) => {
      const dateDifference = new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime();
      return dateDifference || b.version - a.version;
    })[0] ?? null;
}

export function getIndiaWeekRange(at: Date) {
  const indiaOffsetMs = 330 * 60 * 1000;
  const india = new Date(at.getTime() + indiaOffsetMs);
  const day = india.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  const startIndia = new Date(Date.UTC(india.getUTCFullYear(), india.getUTCMonth(), india.getUTCDate() - daysSinceMonday));
  const endIndia = new Date(startIndia.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    start: new Date(startIndia.getTime() - indiaOffsetMs),
    endExclusive: new Date(endIndia.getTime() - indiaOffsetMs),
  };
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isValidDate(value: string): boolean {
  return Boolean(value) && !Number.isNaN(new Date(value).getTime());
}
