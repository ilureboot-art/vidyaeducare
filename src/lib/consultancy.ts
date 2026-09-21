export const CONSULTANCY_CONFIG_ID = "lifeRelationshipConsultancy";

export type Discount = {
  type: "PERCENTAGE" | "FIXED" | "NONE";
  value: number;
  validFrom?: string | null;
  validUntil?: string | null;
};
export type FeeRule = {
  enabled: boolean;
  regularAmount: number;
  discount: Discount;
  taxPercentage: number;
  description: string;
};
export type DocumentStatus =
  "DRAFT" | "UNDER_REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED";
export type VerificationStatus =
  | "PENDING"
  | "SUBMITTED"
  | "UNDER_VERIFICATION"
  | "ADDITIONAL_INFORMATION_REQUIRED"
  | "VERIFIED"
  | "REJECTED";
export type MeetingStatus =
  | "REQUESTED"
  | "CONSENT_PENDING"
  | "PAYMENT_PENDING"
  | "VERIFICATION_PENDING"
  | "ADMIN_REVIEW"
  | "CONTACT_APPROVED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";
export type SuccessFeeStatus =
  | "NOT_DUE"
  | "DUE"
  | "PAID"
  | "OUTSTANDING"
  | "DISPUTED"
  | "UNDER_REVIEW"
  | "WAIVED"
  | "PARTIALLY_PAID"
  | "SETTLED"
  | "CLOSED";
export type BookingStatus =
  | "DRAFT"
  | "PAYMENT_PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "RESCHEDULED"
  | "CANCELLED";

export interface ConsultancyConfig {
  enabled: boolean;
  matrimonialEnabled: boolean;
  counsellingEnabled: boolean;
  title: string;
  registrationFee: FeeRule;
  meetingFee: FeeRule;
  successFee: FeeRule;
  counsellingAdvancePercentage: number;
  bookingLeadHours: number;
  cancellationWindowHours: number;
  reschedulingWindowHours: number;
  maxDailySessions: number;
  timezone: "Asia/Kolkata";
  requiredVerificationTypes: string[];
  contactCategories: string[];
  retentionDays: number;
  complaintCategories: string[];
  codeOfConductCategories: string[];
}

const fee = (
  regularAmount: number,
  discountValue: number,
  description: string,
): FeeRule => ({
  enabled: true,
  regularAmount,
  discount: { type: "PERCENTAGE", value: discountValue },
  taxPercentage: 0,
  description,
});

export const defaultConsultancyConfig: ConsultancyConfig = {
  enabled: true,
  matrimonialEnabled: true,
  counsellingEnabled: true,
  title: "Life & Relationship Consultancy",
  registrationFee: fee(200, 50, "Matrimonial registration"),
  meetingFee: fee(100, 50, "Profile meeting fee per customer per meeting"),
  successFee: fee(10000, 50, "Marriage success fee per matched customer"),
  counsellingAdvancePercentage: 50,
  bookingLeadHours: 24,
  cancellationWindowHours: 24,
  reschedulingWindowHours: 24,
  maxDailySessions: 8,
  timezone: "Asia/Kolkata",
  requiredVerificationTypes: ["IDENTITY", "MOBILE"],
  contactCategories: ["PHONE", "EMAIL"],
  retentionDays: 730,
  complaintCategories: [
    "False Information",
    "Suspected Fraud",
    "Fake Document",
    "Harassment",
    "Abusive Behaviour",
    "Threat",
    "Financial Demand",
    "Privacy Violation",
    "Unauthorized Contact",
    "Misconduct",
    "Other",
  ],
  codeOfConductCategories: [
    "False information",
    "Impersonation",
    "Fraudulent documents",
    "Harassment",
    "Threats",
    "Stalking",
    "Financial solicitation",
    "Unauthorized contact sharing",
    "Privacy violation",
    "Platform misuse",
  ],
};

export const defaultProfileFields = [
  {
    key: "displayName",
    label: "Full Name",
    type: "TEXT",
    required: true,
    customerEditable: true,
    adminEditable: true,
    visibility: "MATCH",
    sortOrder: 1,
  },
  {
    key: "dateOfBirth",
    label: "Date of Birth",
    type: "DATE",
    required: true,
    customerEditable: true,
    adminEditable: true,
    visibility: "MATCH",
    sortOrder: 2,
  },
  {
    key: "gender",
    label: "Gender",
    type: "SELECT",
    options: ["Woman", "Man", "Non-binary", "Prefer not to say"],
    required: true,
    customerEditable: true,
    adminEditable: true,
    visibility: "MATCH",
    sortOrder: 3,
  },
  {
    key: "maritalStatus",
    label: "Marital Status",
    type: "SELECT",
    options: ["Never married", "Divorced", "Widowed", "Separated"],
    required: true,
    customerEditable: true,
    adminEditable: true,
    visibility: "MATCH",
    sortOrder: 4,
  },
  {
    key: "education",
    label: "Education",
    type: "TEXT",
    required: true,
    customerEditable: true,
    adminEditable: true,
    visibility: "MATCH",
    sortOrder: 5,
  },
  {
    key: "profession",
    label: "Profession",
    type: "TEXT",
    required: false,
    customerEditable: true,
    adminEditable: true,
    visibility: "MATCH",
    sortOrder: 6,
  },
  {
    key: "city",
    label: "City",
    type: "TEXT",
    required: true,
    customerEditable: true,
    adminEditable: true,
    visibility: "MATCH",
    sortOrder: 7,
  },
  {
    key: "aboutMe",
    label: "About Me",
    type: "TEXTAREA",
    required: false,
    customerEditable: true,
    adminEditable: true,
    visibility: "MATCH",
    sortOrder: 8,
  },
  {
    key: "partnerPreferences",
    label: "Partner Preferences",
    type: "TEXTAREA",
    required: false,
    customerEditable: true,
    adminEditable: true,
    visibility: "MATCH",
    sortOrder: 9,
  },
  {
    key: "mobile",
    label: "Mobile Number",
    type: "TEL",
    required: true,
    customerEditable: true,
    adminEditable: true,
    visibility: "PROTECTED",
    sortOrder: 10,
  },
  {
    key: "email",
    label: "Email Address",
    type: "EMAIL",
    required: true,
    customerEditable: true,
    adminEditable: true,
    visibility: "PROTECTED",
    sortOrder: 11,
  },
  {
    key: "address",
    label: "Residential Address",
    type: "TEXTAREA",
    required: false,
    customerEditable: true,
    adminEditable: true,
    visibility: "ADMIN_ONLY",
    sortOrder: 12,
  },
];

export const defaultCounsellingServices = [
  "Pre-Marital Counselling",
  "Marriage & Family Counselling",
  "Love & Relationship Counselling",
  "Parenting Counselling",
  "Psychology-Based Non-Clinical Counselling",
].map((name, index) => ({
  id: `default-${index + 1}`,
  name,
  enabled: true,
  sortOrder: index + 1,
  description: "Basic, non-clinical guidance and support.",
  sessionCount: 5,
  sessionDurationMinutes: 60,
  fee: fee(3000, 50, name),
  topics: [],
  disclaimer: name.includes("Psychology-Based")
    ? "This is non-clinical guidance. It is not clinical diagnosis, psychiatric treatment or emergency care."
    : "",
}));

export const requiredMatrimonialDocuments = [
  "MATRIMONIAL_SERVICE_AGREEMENT",
  "SUCCESS_FEE_UNDERTAKING",
  "PRIVACY_NOTICE",
  "CODE_OF_CONDUCT",
];
export const requiredCounsellingDocuments = [
  "COUNSELLING_SERVICE_AGREEMENT",
  "COUNSELLING_DISCLAIMER",
  "PRIVACY_NOTICE",
  "COUNSELLING_CODE_OF_CONDUCT",
];

export function calculateFee(rule: FeeRule, at = new Date()) {
  if (!rule.enabled)
    return {
      regularAmount: 0,
      discountAmount: 0,
      taxableAmount: 0,
      taxAmount: 0,
      payableAmount: 0,
    };
  if (!Number.isFinite(rule.regularAmount) || rule.regularAmount < 0)
    throw new Error("Regular amount must not be negative.");
  const active =
    (!rule.discount.validFrom || at >= new Date(rule.discount.validFrom)) &&
    (!rule.discount.validUntil || at <= new Date(rule.discount.validUntil));
  const discountAmount =
    !active || rule.discount.type === "NONE"
      ? 0
      : rule.discount.type === "FIXED"
        ? Math.min(rule.regularAmount, rule.discount.value)
        : (rule.regularAmount * rule.discount.value) / 100;
  const taxableAmount = Math.max(0, rule.regularAmount - discountAmount);
  const taxAmount = (taxableAmount * rule.taxPercentage) / 100;
  return {
    regularAmount: money(rule.regularAmount),
    discountAmount: money(discountAmount),
    taxableAmount: money(taxableAmount),
    taxAmount: money(taxAmount),
    payableAmount: money(taxableAmount + taxAmount),
  };
}

export function calculateCounsellingPayment(
  rule: FeeRule,
  advancePercentage: number,
  at = new Date(),
) {
  const result = calculateFee(rule, at);
  if (
    !Number.isFinite(advancePercentage) ||
    advancePercentage < 0 ||
    advancePercentage > 100
  )
    throw new Error("Advance percentage must be between 0 and 100.");
  const advanceAmount = money((result.payableAmount * advancePercentage) / 100);
  return {
    ...result,
    advanceAmount,
    balanceAmount: money(result.payableAmount - advanceAmount),
  };
}

export function validateConsultancyConfig(config: ConsultancyConfig) {
  const errors: string[] = [];
  for (const [name, rule] of [
    ["Registration", config.registrationFee],
    ["Meeting", config.meetingFee],
    ["Success", config.successFee],
  ] as const) {
    if (rule.regularAmount < 0) errors.push(`${name} fee cannot be negative.`);
    if (rule.taxPercentage < 0 || rule.taxPercentage > 100)
      errors.push(`${name} tax must be between 0 and 100.`);
    if (
      rule.discount.value < 0 ||
      (rule.discount.type === "PERCENTAGE" && rule.discount.value > 100)
    )
      errors.push(`${name} discount is invalid.`);
  }
  if (
    config.counsellingAdvancePercentage < 0 ||
    config.counsellingAdvancePercentage > 100
  )
    errors.push("Counselling advance must be between 0 and 100%.");
  if (config.maxDailySessions < 1)
    errors.push("Maximum daily sessions must be at least one.");
  if (config.retentionDays < 1)
    errors.push("Retention period must be positive.");
  return errors;
}

const meetingTransitions: Record<MeetingStatus, MeetingStatus[]> = {
  REQUESTED: ["CONSENT_PENDING", "CANCELLED"],
  CONSENT_PENDING: ["PAYMENT_PENDING", "CANCELLED"],
  PAYMENT_PENDING: ["VERIFICATION_PENDING", "CANCELLED"],
  VERIFICATION_PENDING: ["ADMIN_REVIEW", "CANCELLED"],
  ADMIN_REVIEW: ["CONTACT_APPROVED", "CANCELLED"],
  CONTACT_APPROVED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};
export function canTransitionMeeting(from: MeetingStatus, to: MeetingStatus) {
  return meetingTransitions[from]?.includes(to) ?? false;
}

const successTransitions: Record<SuccessFeeStatus, SuccessFeeStatus[]> = {
  NOT_DUE: ["DUE"],
  DUE: ["PAID", "OUTSTANDING", "DISPUTED", "PARTIALLY_PAID", "WAIVED"],
  OUTSTANDING: ["PAID", "DISPUTED", "PARTIALLY_PAID", "WAIVED"],
  DISPUTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["DUE", "SETTLED", "WAIVED"],
  PARTIALLY_PAID: ["PAID", "DISPUTED", "SETTLED"],
  PAID: ["CLOSED"],
  WAIVED: ["CLOSED"],
  SETTLED: ["CLOSED"],
  CLOSED: [],
};
export function canTransitionSuccessFee(
  from: SuccessFeeStatus,
  to: SuccessFeeStatus,
) {
  return successTransitions[from]?.includes(to) ?? false;
}

const bookingTransitions: Record<BookingStatus, BookingStatus[]> = {
  DRAFT: ["PAYMENT_PENDING"],
  PAYMENT_PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "RESCHEDULED", "CANCELLED"],
  RESCHEDULED: ["CONFIRMED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};
export function canTransitionBooking(from: BookingStatus, to: BookingStatus) {
  return bookingTransitions[from]?.includes(to) ?? false;
}

const protectedKeys = new Set([
  "mobile",
  "phone",
  "whatsapp",
  "email",
  "address",
  "fullAddress",
  "residentialAddress",
  "verificationDocuments",
  "adminNotes",
]);
export function sanitizeMatrimonialProfile(
  data: Record<string, unknown>,
  visibleFieldKeys: string[],
) {
  const allowed = new Set(visibleFieldKeys);
  return Object.fromEntries(
    Object.entries(data).filter(
      ([key]) =>
        !protectedKeys.has(key) &&
        (allowed.has(key) ||
          [
            "id",
            "userId",
            "displayName",
            "verificationBadges",
            "status",
            "createdAt",
          ].includes(key)),
    ),
  );
}

export function meetingPaymentId(meetingId: string, userId: string) {
  return `${meetingId}_${userId}`;
}
export function successObligationId(matchId: string, userId: string) {
  return `${matchId}_${userId}`;
}
export function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
