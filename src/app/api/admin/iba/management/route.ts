import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/admin-init";
import {
  calculateAchievement,
  calculateCommission,
  commissionRateForAchievement,
  getTrainingPeriod,
  IbaRemunerationPolicy,
} from "@/lib/iba-remuneration";
import { RequestAuthError, verifyRequester } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  try {
    await verifyRequester(request, true);
    const [sales, eligibility, payouts, users, clients] = await Promise.all([
      adminDb
        .collection("ibaSales")
        .orderBy("soldAt", "desc")
        .limit(1000)
        .get(),
      adminDb.collection("ibaEligibility").get(),
      adminDb
        .collection("ibaPayouts")
        .orderBy("periodStart", "desc")
        .limit(500)
        .get(),
      adminDb.collection("users").get(),
      adminDb.collection("clients").get(),
    ]);
    const userMap = new Map(users.docs.map((doc) => [doc.id, doc.data()]));
    const ibaIds = new Set<string>();
    sales.docs.forEach((doc) => ibaIds.add(doc.data().ibaUid));
    eligibility.docs.forEach((doc) => ibaIds.add(doc.id));
    clients.docs.forEach((doc) => {
      const uid = doc.data().referrerId;
      if (uid) ibaIds.add(uid);
    });
    const ibas = [...ibaIds].map((uid) => {
      const user = userMap.get(uid) ?? {};
      const record =
        eligibility.docs.find((doc) => doc.id === uid)?.data() ?? {};
      return {
        uid,
        name: user.name || user.displayName || user.email || uid,
        email: user.email || "",
        paidActive: user.purchasedMockTest === true,
        ...serialize(record),
      };
    });
    const saleRows = sales.docs.map((doc) => ({
      id: doc.id,
      ...serialize(doc.data()),
    })) as any[];
    const payoutRows = payouts.docs.map((doc) => ({
      id: doc.id,
      ...serialize(doc.data()),
    })) as any[];
    return NextResponse.json({
      ibas,
      sales: saleRows,
      payouts: payoutRows,
      stats: {
        totalIbas: ibas.length,
        paidActiveIbas: ibas.filter((item) => item.paidActive).length,
        inTraining: ibas.filter((item) => item.status === "TRAINING").length,
        eligibleForReview: ibas.filter(
          (item) => item.status === "ELIGIBLE_PENDING_APPROVAL",
        ).length,
        approved: ibas.filter((item) => item.status === "APPROVED").length,
        suspended: ibas.filter((item) => item.status === "SUSPENDED").length,
        eligibleSales: saleRows.filter(
          (item) =>
            item.status === "COMPLETED" && item.eligible && !item.duplicate,
        ).length,
        commissionLiability: payoutRows
          .filter((item) => !["PAID", "REJECTED"].includes(item.status))
          .reduce((sum, item) => sum + Number(item.commissionAmount || 0), 0),
        fixedLiability: payoutRows
          .filter((item) => !["PAID", "REJECTED"].includes(item.status))
          .reduce((sum, item) => sum + Number(item.fixedRemuneration || 0), 0),
        pendingPayouts: payoutRows.filter((item) =>
          ["CALCULATED", "PENDING_REVIEW", "APPROVED", "ON_HOLD"].includes(
            item.status,
          ),
        ).length,
        completedPayouts: payoutRows.filter((item) => item.status === "PAID")
          .length,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyRequester(request, true);
    const body = await request.json();
    if (body.action === "SET_POLICY_ACTIVE") {
      if (typeof body.ibaUid !== "string" || !body.ibaUid || typeof body.active !== "boolean")
        return NextResponse.json({ error: "Valid IBA and activation state are required." }, { status: 400 });
      const ref = adminDb.collection("ibaEligibility").doc(body.ibaUid);
      const now = new Date();
      const [old, userDoc, publishedPolicies] = await Promise.all([
        ref.get(), adminDb.collection("users").doc(body.ibaUid).get(),
        adminDb.collection("ibaRemunerationPolicies").where("active", "==", true).where("status", "==", "PUBLISHED").get(),
      ]);
      if (!userDoc.exists) return NextResponse.json({ error: "IBA user not found." }, { status: 404 });
      const policyDoc = publishedPolicies.docs
        .filter((doc) => new Date(String(doc.data().effectiveFrom || "invalid")) <= now)
        .sort((a, b) => Number(b.data().version || 0) - Number(a.data().version || 0))[0];
      if (body.active) {
        if (!policyDoc) return NextResponse.json({ error: "Publish an effective remuneration policy first." }, { status: 409 });
        const policy = policyDoc.data() as IbaRemunerationPolicy;
        const user = userDoc.data()!;
        const record = old.data() ?? {};
        const expiry = toDate(user.mockTestSubscription?.expiresAt);
        const subscriptionActive = user.mockTestSubscription
          ? user.mockTestSubscription.status === "ACTIVE" && user.mockTestSubscription.productId === policy.requiredProductId && Boolean(expiry && expiry > now)
          : user.purchasedMockTest === true;
        const joined = toDate(record.trainingStartDate) || toDate(user.joinDate) || toDate(user.createdAt);
        if (!joined) return NextResponse.json({ error: "IBA joining/training date is missing." }, { status: 409 });
        const training = getTrainingPeriod(joined, policy.trainingPeriodMonths);
        const saleDocs = await adminDb.collection("ibaSales").where("ibaUid", "==", body.ibaUid).get();
        const validSales = saleDocs.docs.filter((doc) => {
          const sale = doc.data(); const soldAt = toDate(sale.soldAt);
          return soldAt && soldAt >= training.start && soldAt < training.endExclusive && sale.status === "COMPLETED" && sale.eligible === true && sale.duplicate !== true;
        }).length;
        if (record.managementStatus !== "APPROVED" || user.purchasedMockTest !== true || !subscriptionActive || ["SUSPENDED", "INACTIVE"].includes(user.accountStatus) || now < training.endExclusive || calculateAchievement(validSales, policy.monthlyTrainingTarget) < policy.minimumAchievementPercentage) {
          return NextResponse.json({ error: "Management approval, completed training, target achievement, active account and annual subscription are required." }, { status: 409 });
        }
      }
      const previous = old.data()?.policyActive === true;
      if (previous === body.active) return NextResponse.json({ success: true });
      const batch = adminDb.batch();
      batch.set(ref, {
        policyActive: body.active, status: body.active ? "APPROVED" : "ELIGIBLE_PENDING_APPROVAL",
        policyActivationRemarks: String(body.remarks || "").slice(0, 1000),
        policyActivatedBy: admin.uid, policyActivatedAt: FieldValue.serverTimestamp(),
        policyId: body.active ? policyDoc?.id : old.data()?.policyId || null,
        policyVersion: body.active ? policyDoc?.data()?.version : old.data()?.policyVersion || null,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      batch.create(adminDb.collection("ibaPayoutHistory").doc(), {
        ibaUid: body.ibaUid, recordType: "POLICY_ACTIVATION", previousValue: previous,
        newValue: body.active, remarks: String(body.remarks || "").slice(0, 1000),
        changedBy: admin.uid, changedAt: FieldValue.serverTimestamp(),
        policyId: policyDoc?.id || null, policyVersion: policyDoc?.data()?.version || null,
      });
      await batch.commit();
      return NextResponse.json({ success: true });
    }
    if (body.action === "SET_ELIGIBILITY") {
      if (
        !body.ibaUid ||
        ![
          "APPROVED",
          "NOT_ELIGIBLE",
          "SUSPENDED",
          "ELIGIBLE_PENDING_APPROVAL",
        ].includes(body.status)
      )
        return NextResponse.json(
          { error: "Invalid eligibility action." },
          { status: 400 },
        );
      const ref = adminDb.collection("ibaEligibility").doc(body.ibaUid);
      const old = await ref.get();
      if (body.status === "APPROVED") {
        const data = old.data();
        if (
          !data?.paidActive ||
          !data?.subscriptionActive ||
          !data?.trainingCompleted ||
          data?.status !== "ELIGIBLE_PENDING_APPROVAL"
        ) {
          return NextResponse.json(
            {
              error:
                "This IBA has not completed all policy eligibility requirements.",
            },
            { status: 409 },
          );
        }
      }
      const batch = adminDb.batch();
      batch.set(
        ref,
        {
          status: body.status === "APPROVED" && old.data()?.policyActive !== true ? "ELIGIBLE_PENDING_APPROVAL" : body.status,
          ...(body.status === "SUSPENDED" || body.status === "NOT_ELIGIBLE" ? { policyActive: false } : {}),
          managementStatus:
            body.status === "APPROVED"
              ? "APPROVED"
              : body.status === "SUSPENDED"
                ? "SUSPENDED"
                : body.status === "NOT_ELIGIBLE"
                  ? "REJECTED"
                  : "PENDING",
          remarks: String(body.remarks || ""),
          reviewedBy: admin.uid,
          reviewedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      batch.create(adminDb.collection("ibaPayoutHistory").doc(), {
        ibaUid: body.ibaUid,
        recordType: "ELIGIBILITY",
        previousValue: old.exists ? old.data() : null,
        newStatus: body.status,
        remarks: String(body.remarks || ""),
        changedBy: admin.uid,
        changedAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();
      return NextResponse.json({ success: true });
    }
    if (body.action === "CALCULATE_PAYOUT") {
      const start = new Date(body.periodStart);
      const end = new Date(body.periodEndExclusive);
      if (
        !body.ibaUid ||
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        end <= start
      )
        return NextResponse.json(
          { error: "Valid IBA and payout period are required." },
          { status: 400 },
        );
      if (end > new Date())
        return NextResponse.json(
          {
            error:
              "A payout can only be calculated after the payout period has ended.",
          },
          { status: 400 },
        );
      const [snapshot, matrimonialSnapshot, activePolicies] = await Promise.all(
        [
          adminDb
            .collection("ibaSales")
            .where("ibaUid", "==", body.ibaUid)
            .where("weekStart", "==", Timestamp.fromDate(start))
            .get(),
          adminDb
            .collection("ibaMatrimonialCommissions")
            .where("ibaUid", "==", body.ibaUid)
            .get(),
          adminDb
            .collection("ibaRemunerationPolicies")
            .where("active", "==", true)
            .where("status", "==", "PUBLISHED")
            .get(),
        ],
      );
      const eligible = snapshot.docs.filter((doc) => {
        const sale = doc.data();
        return (
          sale.status === "COMPLETED" &&
          sale.eligible === true &&
          sale.duplicate !== true
        );
      });
      const matrimonialEligible = matrimonialSnapshot.docs.filter((doc) => {
        const commission = doc.data();
        const eligibleAt =
          toDate(commission.eligibleAt) || toDate(commission.createdAt);
        return (
          commission.status === "APPROVED" &&
          !commission.payoutReference &&
          eligibleAt &&
          eligibleAt >= start &&
          eligibleAt < end
        );
      });
      const first = eligible[0]?.data();
      if (!first && !matrimonialEligible.length)
        return NextResponse.json(
          {
            error:
              "No eligible sales or approved Matrimonial commissions found for this period.",
          },
          { status: 400 },
        );
      const fallbackPolicyDoc = activePolicies.docs.sort(
        (a, b) => Number(b.data().version || 0) - Number(a.data().version || 0),
      )[0];
      const fallbackPolicy = fallbackPolicyDoc?.data() as
        IbaRemunerationPolicy | undefined;
      const policy = (first?.policySnapshot || fallbackPolicy) as Pick<
        IbaRemunerationPolicy,
        | "weeklySalesTarget"
        | "minimumAchievementPercentage"
        | "standardCommissionPercentage"
        | "reducedCommissionPercentage"
      >;
      if (!policy)
        return NextResponse.json(
          { error: "A published IBA Remuneration Policy is required." },
          { status: 409 },
        );
      const achievement = calculateAchievement(
        eligible.length,
        policy.weeklySalesTarget,
      );
      const rate = commissionRateForAchievement(
        achievement,
        policy as IbaRemunerationPolicy,
      );
      const salesCommissionAmount = eligible.reduce((sum, doc) => {
        const sale = doc.data();
        return (
          sum +
          calculateCommission(
            Number(sale.baseAmount),
            rate,
            Number(sale.splitFactor || 1),
          )
        );
      }, 0);
      const matrimonialCommissionAmount = matrimonialEligible.reduce(
        (sum, doc) => sum + Number(doc.data().commissionAmount || 0),
        0,
      );
      const commissionAmount =
        salesCommissionAmount + matrimonialCommissionAmount;
      const adjustment = Number(body.adjustment || 0);
      let fixed = Math.max(0, Number(body.fixedRemuneration || 0));
      if (!Number.isFinite(adjustment) || !Number.isFinite(fixed))
        return NextResponse.json(
          { error: "Invalid payout amount." },
          { status: 400 },
        );
      const [policyDocument, eligibilityDocument] = await Promise.all([
        first?.policyId
          ? adminDb
              .collection("ibaRemunerationPolicies")
              .doc(first.policyId)
              .get()
          : Promise.resolve(fallbackPolicyDoc),
        adminDb.collection("ibaEligibility").doc(body.ibaUid).get(),
      ]);
      if (fixed > 0) {
        if (eligibilityDocument.data()?.status !== "APPROVED" || eligibilityDocument.data()?.policyActive !== true)
          return NextResponse.json(
            {
              error: "Fixed Monthly Remuneration requires management approval.",
            },
            { status: 403 },
          );
        const activatedAt = toDate(eligibilityDocument.data()?.policyActivatedAt);
        if (!activatedAt || activatedAt >= end)
          return NextResponse.json({ error: "The IBA policy was not active during this payout period." }, { status: 403 });
        const ibaUser = await adminDb.collection("users").doc(body.ibaUid).get();
        const ibaAccount = ibaUser.data() ?? {};
        const expiry = toDate(ibaAccount.mockTestSubscription?.expiresAt);
        if (ibaAccount.purchasedMockTest !== true || ["SUSPENDED", "INACTIVE"].includes(ibaAccount.accountStatus) ||
          (ibaAccount.mockTestSubscription && (ibaAccount.mockTestSubscription.status !== "ACTIVE" || ibaAccount.mockTestSubscription.productId !== policyDocument.data()?.requiredProductId || !expiry || expiry <= new Date())))
          return NextResponse.json({ error: "The IBA subscription and account must still be active." }, { status: 403 });
        const approvedMaximum = Number(
          policyDocument.data()?.fixedMonthlyRemuneration || 0,
        );
        if (fixed > approvedMaximum)
          return NextResponse.json(
            {
              error: "Fixed remuneration exceeds the applicable policy amount.",
            },
            { status: 400 },
          );
      }
      const referralSnapshot = await adminDb
        .collection("transactions")
        .where("user", "==", body.ibaUid)
        .get();
      const referralIncome = referralSnapshot.docs
        .filter((doc) => {
          const tx = doc.data();
          const date =
            tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date);
          return (
            tx.type === "Referral Bonus" &&
            date >= start &&
            date < end &&
            tx.status === "Completed"
          );
        })
        .reduce<number>(
          (sum, doc) => sum + Math.max(0, Number(doc.data().amount || 0)),
          0,
        );
      const totalPayable =
        commissionAmount + fixed + referralIncome + adjustment;
      if (totalPayable < 0)
        return NextResponse.json(
          { error: "Adjustments cannot make the total payable negative." },
          { status: 400 },
        );
      const payoutId = `${body.ibaUid}_${start.toISOString().slice(0, 10)}`;
      const payoutRef = adminDb.collection("ibaPayouts").doc(payoutId);
      const batch = adminDb.batch();
      batch.create(payoutRef, {
        ibaUid: body.ibaUid,
        periodStart: start,
        periodEndExclusive: end,
        eligibleSales: eligible.length,
        salesAmount: eligible.reduce<number>(
          (sum, doc) =>
            sum +
            Number(doc.data().baseAmount || 0) *
              Number(doc.data().splitFactor || 1),
          0,
        ),
        achievementPercentage: achievement,
        commissionPercentage: rate,
        commissionAmount,
        salesCommissionAmount,
        matrimonialCommissionAmount,
        fixedRemuneration: fixed,
        referralIncome,
        adjustments: adjustment,
        totalPayable,
        status: "PENDING_REVIEW",
        policyId: first?.policyId || fallbackPolicyDoc?.id || null,
        policyVersion: first?.policyVersion || fallbackPolicy?.version || null,
        saleIds: eligible.map((doc) => doc.id),
        matrimonialCommissionIds: matrimonialEligible.map((doc) => doc.id),
        calculatedBy: admin.uid,
        calculatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      });
      matrimonialEligible.forEach((doc) =>
        batch.update(doc.ref, {
          payoutReference: payoutId,
          updatedAt: FieldValue.serverTimestamp(),
        }),
      );
      if (fixed > 0) {
        const indiaMonth = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
        }).format(start);
        batch.create(
          adminDb
            .collection("ibaFixedRemunerationClaims")
            .doc(`${body.ibaUid}_${indiaMonth}`),
          {
            ibaUid: body.ibaUid,
            month: indiaMonth,
            payoutId,
            amount: fixed,
            policyId: first?.policyId || fallbackPolicyDoc?.id || null,
            policyVersion:
              first?.policyVersion || fallbackPolicy?.version || null,
            createdBy: admin.uid,
            createdAt: FieldValue.serverTimestamp(),
          },
        );
      }
      await batch.commit();
      return NextResponse.json({ success: true, payoutId });
    }
    if (body.action === "UPDATE_SALE_STATUS") {
      if (!body.saleId || !["CANCELLED", "REFUNDED"].includes(body.status))
        return NextResponse.json(
          { error: "Invalid sale status update." },
          { status: 400 },
        );
      const ref = adminDb.collection("ibaSales").doc(body.saleId);
      const current = await ref.get();
      if (!current.exists)
        return NextResponse.json({ error: "Sale not found." }, { status: 404 });
      const linkedPayouts = await adminDb
        .collection("ibaPayouts")
        .where("saleIds", "array-contains", body.saleId)
        .get();
      const paidPayout = linkedPayouts.docs.find(
        (doc) => doc.data().status === "PAID",
      );
      const batch = adminDb.batch();
      batch.update(ref, {
        status: body.status,
        eligible: false,
        ineligibilityReason: body.status,
        updatedBy: admin.uid,
        updatedAt: FieldValue.serverTimestamp(),
      });
      linkedPayouts.docs
        .filter((doc) => doc.data().status !== "PAID")
        .forEach((doc) =>
          batch.update(doc.ref, {
            status: "ON_HOLD",
            remarks: `Sale ${body.saleId} was ${String(body.status).toLowerCase()}; recalculate payout.`,
            updatedBy: admin.uid,
            updatedAt: FieldValue.serverTimestamp(),
          }),
        );
      if (paidPayout) {
        const payout = paidPayout.data();
        const sale = current.data()!;
        const amount = -calculateCommission(
          Number(sale.baseAmount || 0),
          Number(payout.commissionPercentage || 0),
          Number(sale.splitFactor || 1),
        );
        batch.create(adminDb.collection("ibaPayoutHistory").doc(), {
          ibaUid: sale.ibaUid,
          payoutId: paidPayout.id,
          saleId: body.saleId,
          recordType: "ADJUSTMENT_REQUIRED",
          reason: body.status,
          adjustmentAmount: amount,
          status: "PENDING_REVIEW",
          changedBy: admin.uid,
          changedAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
      return NextResponse.json({
        success: true,
        adjustmentRequired: Boolean(paidPayout),
      });
    }
    if (body.action === "UPDATE_PAYOUT") {
      if (
        !body.payoutId ||
        !["PENDING_REVIEW", "APPROVED", "PAID", "ON_HOLD", "REJECTED"].includes(
          body.status,
        )
      )
        return NextResponse.json(
          { error: "Invalid payout action." },
          { status: 400 },
        );
      const ref = adminDb.collection("ibaPayouts").doc(body.payoutId);
      const current = await ref.get();
      if (!current.exists)
        return NextResponse.json(
          { error: "Payout not found." },
          { status: 404 },
        );
      if (current.data()?.status === "PAID")
        return NextResponse.json(
          {
            error:
              "A paid payout is immutable. Create an audited adjustment instead.",
          },
          { status: 409 },
        );
      if (
        body.status === "PAID" &&
        (!body.paymentReference || !body.payoutDate)
      )
        return NextResponse.json(
          { error: "Payment reference and payout date are required." },
          { status: 400 },
        );
      const batch = adminDb.batch();
      batch.update(ref, {
        status: body.status,
        paymentReference: String(body.paymentReference || ""),
        payoutDate: body.payoutDate
          ? Timestamp.fromDate(new Date(body.payoutDate))
          : null,
        remarks: String(body.remarks || ""),
        updatedBy: admin.uid,
        updatedAt: FieldValue.serverTimestamp(),
      });
      if (body.status === "PAID") {
        for (const commissionId of current.data()?.matrimonialCommissionIds ||
          []) {
          batch.update(
            adminDb.collection("ibaMatrimonialCommissions").doc(commissionId),
            {
              status: "PAID",
              payoutReference: ref.id,
              paidAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            },
          );
        }
        if ((current.data()?.matrimonialCommissionIds || []).length)
          batch.create(adminDb.collection("notifications").doc(), {
            userId: current.data()?.ibaUid,
            type: "matrimonial_commission_paid",
            message:
              "Your approved matrimonial referral commission was included in a paid IBA payout.",
            status: "unread",
            timestamp: FieldValue.serverTimestamp(),
          });
      }
      if (body.status === "REJECTED") {
        for (const commissionId of current.data()?.matrimonialCommissionIds ||
          []) {
          batch.update(
            adminDb.collection("ibaMatrimonialCommissions").doc(commissionId),
            {
              payoutReference: FieldValue.delete(),
              updatedAt: FieldValue.serverTimestamp(),
            },
          );
        }
      }
      batch.create(adminDb.collection("ibaPayoutHistory").doc(), {
        ibaUid: current.data()?.ibaUid,
        payoutId: ref.id,
        recordType: "PAYOUT",
        previousStatus: current.data()?.status,
        newStatus: body.status,
        paymentReference: String(body.paymentReference || ""),
        remarks: String(body.remarks || ""),
        changedBy: admin.uid,
        changedAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();
      return NextResponse.json({ success: true });
    }
    return NextResponse.json(
      { error: "Unknown management action." },
      { status: 400 },
    );
  } catch (error: any) {
    if (error?.code === 6 || String(error?.message).includes("ALREADY_EXISTS"))
      return NextResponse.json(
        { error: "A payout for this IBA and period already exists." },
        { status: 409 },
      );
    return apiError(error);
  }
}

function serialize(value: any): any {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serialize(item)]),
    );
  return value;
}
function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
function apiError(error: unknown) {
  const status = error instanceof RequestAuthError ? error.status : 500;
  console.error("IBA management API failed:", error);
  return NextResponse.json(
    {
      error:
        error instanceof Error ? error.message : "Management operation failed.",
    },
    { status },
  );
}
