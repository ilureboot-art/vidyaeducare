import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/admin-init";
import {
  calculateAchievement,
  commissionRateForAchievement,
  defaultIbaRemunerationPolicy,
  determinePreliminaryEligibility,
  getIndiaWeekRange,
  getTrainingPeriod,
  IbaRemunerationPolicy,
} from "@/lib/iba-remuneration";
import { RequestAuthError, verifyRequester } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  try {
    const requester = await verifyRequester(request);
    const now = new Date();
    const week = getIndiaWeekRange(now);
    const [
      userDoc,
      eligibilityDoc,
      policies,
      sales,
      payouts,
      matrimonialReferrals,
      matrimonialCommissions,
    ] = await Promise.all([
      adminDb.collection("users").doc(requester.uid).get(),
      adminDb.collection("ibaEligibility").doc(requester.uid).get(),
      adminDb
        .collection("ibaRemunerationPolicies")
        .where("active", "==", true)
        .where("status", "==", "PUBLISHED")
        .get(),
      adminDb.collection("ibaSales").where("ibaUid", "==", requester.uid).get(),
      adminDb
        .collection("ibaPayouts")
        .where("ibaUid", "==", requester.uid)
        .get(),
      adminDb
        .collection("ibaMatrimonialReferrals")
        .where("ibaUid", "==", requester.uid)
        .get(),
      adminDb
        .collection("ibaMatrimonialCommissions")
        .where("ibaUid", "==", requester.uid)
        .get(),
    ]);
    const policyDoc = policies.docs
      .filter(
        (doc) => new Date(String(doc.data().effectiveFrom || "invalid")) <= now,
      )
      .sort(
        (a, b) => Number(b.data().version || 0) - Number(a.data().version || 0),
      )[0];
    const policy = policyDoc
      ? ({ id: policyDoc.id, ...policyDoc.data() } as IbaRemunerationPolicy)
      : defaultIbaRemunerationPolicy;
    const user = userDoc.data() ?? {};
    const eligibility = eligibilityDoc.data() ?? {};
    const subscriptionExpiry = toDate(user.mockTestSubscription?.expiresAt);
    const subscriptionActive =
      user.mockTestSubscription?.status === "ACTIVE" &&
      user.mockTestSubscription?.productId === policy.requiredProductId &&
      Boolean(subscriptionExpiry && subscriptionExpiry > now);
    const paidActive =
      user.purchasedMockTest === true &&
      (subscriptionActive || !user.mockTestSubscription);
    const joining =
      toDate(eligibility.trainingStartDate) ??
      toDate(user.joinDate) ??
      toDate(user.createdAt) ??
      now;
    const training = getTrainingPeriod(joining, policy.trainingPeriodMonths);
    const trainingSales = sales.docs.filter((doc) => {
      const data = doc.data();
      const date = toDate(data.soldAt);
      return (
        date &&
        date >= training.start &&
        date < training.endExclusive &&
        data.status === "COMPLETED" &&
        data.eligible &&
        !data.duplicate
      );
    }).length;
    const trainingAchievement = calculateAchievement(
      trainingSales,
      policy.monthlyTrainingTarget,
    );
    const weeklySales = sales.docs.filter((doc) => {
      const data = doc.data();
      const date = toDate(data.soldAt);
      return (
        date &&
        date >= week.start &&
        date < week.endExclusive &&
        data.status === "COMPLETED" &&
        data.eligible &&
        !data.duplicate
      );
    });
    const achievement = calculateAchievement(
      weeklySales.length,
      policy.weeklySalesTarget,
    );
    const currentRate = commissionRateForAchievement(achievement, policy);
    const status = determinePreliminaryEligibility(
      {
        paidActive,
        subscriptionActive: subscriptionActive || !user.mockTestSubscription,
        accountActive:
          user.accountStatus !== "SUSPENDED" &&
          user.accountStatus !== "INACTIVE",
        trainingCompleted: now >= training.endExclusive,
        trainingAchievementPercentage: trainingAchievement,
        managementStatus: eligibility.managementStatus,
      },
      policy,
    );
    await adminDb
      .collection("ibaEligibility")
      .doc(requester.uid)
      .set(
        {
          ibaUid: requester.uid,
          joiningDate: joining,
          paidActive,
          subscriptionActive,
          trainingStartDate: training.start,
          trainingEndDate: training.endExclusive,
          trainingSales,
          trainingTarget: policy.monthlyTrainingTarget,
          achievementPercentage: trainingAchievement,
          trainingCompleted: now >= training.endExclusive,
          status,
          managementStatus: eligibility.managementStatus || "PENDING",
          policyId: policy.id || null,
          policyVersion: policy.version,
          updatedAt: Timestamp.now(),
        },
        { merge: true },
      );
    const payoutRows = payouts.docs.map((doc) => ({
      id: doc.id,
      ...serialize(doc.data()),
    })) as any[];
    const matrimonialRows = matrimonialCommissions.docs.map((doc) => {
      const value = serialize(doc.data());
      return {
        id: doc.id,
        date: value.createdAt,
        customerReference: `Customer ${String(value.customerId || "").slice(0, 6)}…`,
        event: value.commissionType,
        qualifyingAmount: value.qualifyingAmount,
        commissionAmount: value.commissionAmount,
        status: value.status,
      };
    }) as any[];
    return NextResponse.json({
      policy: policyDoc ? { ...policy, id: policyDoc.id } : null,
      status,
      paidActive,
      subscriptionActive,
      training: {
        start: training.start,
        endExclusive: training.endExclusive,
        daysRemaining: Math.max(
          0,
          Math.ceil(
            (training.endExclusive.getTime() - now.getTime()) / 86400000,
          ),
        ),
        sales: trainingSales,
        target: policy.monthlyTrainingTarget,
        achievementPercentage: trainingAchievement,
        completed: now >= training.endExclusive,
      },
      weekly: {
        target: policy.weeklySalesTarget,
        sales: weeklySales.length,
        remaining: Math.max(0, policy.weeklySalesTarget - weeklySales.length),
        achievementPercentage: achievement,
        commissionPercentage: currentRate,
        weekStart: week.start,
        weekEndExclusive: week.endExclusive,
      },
      fixedRemuneration: {
        eligible: status === "APPROVED",
        approvalStatus: eligibility.managementStatus || "PENDING",
        approvedAmount:
          status === "APPROVED" ? policy.fixedMonthlyRemuneration : 0,
      },
      earnings: {
        pending: payoutRows
          .filter((p) => !["PAID", "REJECTED"].includes(p.status))
          .reduce((sum, p) => sum + Number(p.totalPayable || 0), 0),
        paid: payoutRows
          .filter((p) => p.status === "PAID")
          .reduce((sum, p) => sum + Number(p.totalPayable || 0), 0),
        history: payoutRows.sort((a, b) =>
          String(b.periodStart).localeCompare(String(a.periodStart)),
        ),
      },
      matrimonialReferrals: {
        totalCustomers: matrimonialReferrals.size,
        activeCustomers: matrimonialReferrals.docs.filter(
          (doc) => doc.data().attributionStatus === "LOCKED",
        ).length,
        qualifyingMeetings: matrimonialRows.filter(
          (row) => row.event === "PROFILE_MEETING",
        ).length,
        marriageFixedCount: matrimonialRows.filter(
          (row) => row.event === "MARRIAGE_FIXED",
        ).length,
        pendingCommission: matrimonialRows
          .filter((row) => ["PENDING", "ON_HOLD"].includes(row.status))
          .reduce((sum, row) => sum + Number(row.commissionAmount || 0), 0),
        eligibleCommission: matrimonialRows
          .filter((row) => row.status === "ELIGIBLE")
          .reduce((sum, row) => sum + Number(row.commissionAmount || 0), 0),
        approvedCommission: matrimonialRows
          .filter((row) => row.status === "APPROVED")
          .reduce((sum, row) => sum + Number(row.commissionAmount || 0), 0),
        paidCommission: matrimonialRows
          .filter((row) => row.status === "PAID")
          .reduce((sum, row) => sum + Number(row.commissionAmount || 0), 0),
        history: matrimonialRows.sort((a, b) =>
          String(b.date).localeCompare(String(a.date)),
        ),
      },
    });
  } catch (error) {
    const status = error instanceof RequestAuthError ? error.status : 500;
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to load earnings.",
      },
      { status },
    );
  }
}
function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
function serialize(value: any): any {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, serialize(v)]),
    );
  return value;
}
