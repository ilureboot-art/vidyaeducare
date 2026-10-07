export function legacyAccessReview(user: Record<string, unknown>, codes: Record<string, unknown>, students: Record<string, unknown>[], complete: boolean) {
  const claimedStudents = students.filter(s => s.mockTestSubscribed === true).length;
  const unusedCodes = Array.isArray(codes.codes) ? codes.codes.length : 0;
  const reasons: string[] = [];
  if (claimedStudents) reasons.push('CLIENT_EDITABLE_STUDENT_PAID_FLAG');
  if (unusedCodes) reasons.push('CLIENT_EDITABLE_LEGACY_ACTIVATION_CODES');
  if (user.purchasedMockTest === true || user.mockTestSubscription) reasons.push('PURCHASE_EVIDENCE_REVIEW_REQUIRED');
  if (!complete) reasons.push('STUDENT_SCAN_LIMIT');
  return { studentCount: students.length, claimedPaidStudents: claimedStudents, unusedCodeCount: unusedCodes,
    complete, status: reasons.length ? 'REVIEW_REQUIRED' : 'NO_PAID_CLAIM_FOUND', reasons,
    verifiedPaid: false as const };
}
