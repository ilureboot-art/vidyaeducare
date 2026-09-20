import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/admin-init";
import { RequestAuthError, verifyRequester } from "@/lib/server-auth";
import {
  calculateCounsellingPayment,
  calculateFee,
  CONSULTANCY_CONFIG_ID,
  ConsultancyConfig,
  defaultConsultancyConfig,
  defaultProfileFields,
  meetingPaymentId,
  requiredCounsellingDocuments,
  requiredMatrimonialDocuments,
  sanitizeMatrimonialProfile,
} from "@/lib/consultancy";
import {
  calculateMatrimonialCommission,
  commissionRecordId,
  isPolicyEffective,
  MatrimonialCommissionEvent,
  MatrimonialCommissionPolicy,
} from "@/lib/matrimonial-iba-commission";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRequester(request);
    const view = request.nextUrl.searchParams.get("view") || "dashboard";
    if (view === "matches") {
      await requireActiveMatrimonialService();
      return matches(user.uid);
    }
    if (view === "validateReferral")
      return validateMatrimonialReferral(
        String(request.nextUrl.searchParams.get("code") || ""),
      );
    if (view === "contact")
      return contact(
        user.uid,
        request.nextUrl.searchParams.get("meetingId") || "",
      );
    const [
      profile,
      verification,
      meetings,
      bookings,
      obligations,
      acceptances,
      complaints,
      incomingInterests,
      outgoingInterests,
      entitlement,
      referralAttribution,
    ] = await Promise.all([
      adminDb.collection("matrimonialProfiles").doc(user.uid).get(),
      adminDb.collection("consultancyVerifications").doc(user.uid).get(),
      adminDb
        .collection("matrimonialMeetings")
        .where("participantIds", "array-contains", user.uid)
        .get(),
      adminDb
        .collection("counsellingBookings")
        .where("userId", "==", user.uid)
        .get(),
      adminDb
        .collection("successFeeObligations")
        .where("userId", "==", user.uid)
        .get(),
      adminDb
        .collection("consultancyAcceptances")
        .where("userId", "==", user.uid)
        .get(),
      adminDb
        .collection("consultancyComplaints")
        .where("reportedBy", "==", user.uid)
        .get(),
      adminDb
        .collection("matrimonialInterests")
        .where("toUserId", "==", user.uid)
        .get(),
      adminDb
        .collection("matrimonialInterests")
        .where("fromUserId", "==", user.uid)
        .get(),
      adminDb
        .collection("consultancyEntitlements")
        .doc(`${user.uid}_MATRIMONIAL`)
        .get(),
      adminDb.collection("ibaMatrimonialReferrals").doc(user.uid).get(),
    ]);
    return NextResponse.json({
      profile: profile.exists ? { id: profile.id, ...profile.data() } : null,
      verification: verification.data() || null,
      meetings: docs(meetings),
      bookings: docs(bookings),
      successFeeObligations: docs(obligations),
      acceptances: docs(acceptances),
      complaints: docs(complaints),
      incomingInterests: docs(incomingInterests),
      outgoingInterests: docs(outgoingInterests),
      entitlement: entitlement.exists
        ? { id: entitlement.id, ...entitlement.data() }
        : null,
      referralAttribution: referralAttribution.exists
        ? {
            referralCode: referralAttribution.data()?.referralCode || null,
            referralSource: referralAttribution.data()?.referralSource,
            attributionStatus: referralAttribution.data()?.attributionStatus,
          }
        : null,
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequester(request);
    const body = await request.json();
    if (
      [
        "SAVE_PROFILE",
        "SUBMIT_VERIFICATION",
        "EXPRESS_INTEREST",
        "RESPOND_INTEREST",
        "REQUEST_MEETING",
        "CONSENT_MEETING",
        "PAY_MEETING",
      ].includes(body.action)
    )
      await requireActiveMatrimonialService();
    switch (body.action) {
      case "REGISTER_MATRIMONIAL":
        return register(user.uid, body);
      case "SAVE_PROFILE":
        return saveProfile(user.uid, body.profile || {});
      case "SUBMIT_VERIFICATION":
        return submitVerification(user.uid, body);
      case "EXPRESS_INTEREST":
        return expressInterest(user.uid, String(body.targetUserId || ""));
      case "RESPOND_INTEREST":
        return respondInterest(
          user.uid,
          String(body.interestId || ""),
          String(body.response || ""),
        );
      case "REQUEST_MEETING":
        return requestMeeting(user.uid, body);
      case "CONSENT_MEETING":
        return consentMeeting(
          user.uid,
          String(body.meetingId || ""),
          Boolean(body.consent),
        );
      case "PAY_MEETING":
        return payMeeting(
          user.uid,
          String(body.meetingId || ""),
          String(body.idempotencyKey || ""),
        );
      case "BOOK_COUNSELLING":
        return bookCounselling(user.uid, body);
      case "PAY_COUNSELLING_BALANCE":
        return payCounsellingBalance(user.uid, body);
      case "PAY_SUCCESS_FEE":
        return paySuccessFee(user.uid, body);
      case "REPORT_CONCERN":
        return reportConcern(user.uid, body);
      case "DISPUTE_SUCCESS_FEE":
        return disputeSuccessFee(user.uid, body);
      default:
        return NextResponse.json(
          { error: "Unsupported consultancy action." },
          { status: 400 },
        );
    }
  } catch (error) {
    return fail(error);
  }
}

async function config() {
  const snap = await adminDb
    .collection("configs")
    .doc(CONSULTANCY_CONFIG_ID)
    .get();
  return snap.exists
    ? ({ ...defaultConsultancyConfig, ...snap.data() } as ConsultancyConfig)
    : defaultConsultancyConfig;
}
async function requireActiveMatrimonialService() {
  const cfg = await config();
  if (!cfg.enabled || !cfg.matrimonialEnabled)
    throw new ApiError("Matrimonial Bureau is currently inactive.", 503);
}
async function register(uid: string, body: any) {
  const cfg = await config();
  if (!cfg.enabled || !cfg.matrimonialEnabled)
    throw new ApiError("Matrimonial Bureau is unavailable.", 503);
  const ids = Array.isArray(body.acceptedDocumentVersionIds)
    ? body.acceptedDocumentVersionIds.filter((x: any) => typeof x === "string")
    : [];
  const acceptedDocs = await Promise.all(
    ids.map((id: string) =>
      adminDb.collection("consultancyDocumentVersions").doc(id).get(),
    ),
  );
  const published = acceptedDocs.filter(
    (d) => d.exists && d.data()?.status === "PUBLISHED",
  );
  const types = new Set(published.map((d) => d.data()?.type));
  if (requiredMatrimonialDocuments.some((type) => !types.has(type)))
    throw new ApiError(
      "All current matrimonial agreements, privacy notice, Code of Conduct and Success Fee Undertaking must be affirmatively accepted.",
      400,
    );
  const price = calculateFee(cfg.registrationFee),
    key = String(body.idempotencyKey || "");
  validateKey(key);
  const referralCode = String(body.referralCode || "")
    .trim()
    .toUpperCase();
  let referral: Awaited<ReturnType<typeof resolveEligibleIba>> = null;
  if (referralCode) {
    if (body.referralConfirmed !== true)
      throw new ApiError("Confirm the verified IBA referral.", 400);
    referral = await resolveEligibleIba(referralCode);
    if (!referral)
      throw new ApiError(
        "This IBA ID is invalid or currently ineligible.",
        400,
      );
    if (referral.ibaUid === uid)
      throw new ApiError("Self-referral is not permitted.", 400);
  }
  const requestRef = adminDb
      .collection("consultancyPaymentRequests")
      .doc(`${uid}_${key}`),
    walletRef = adminDb.collection("wallets").doc(uid),
    entitlementRef = adminDb
      .collection("consultancyEntitlements")
      .doc(`${uid}_MATRIMONIAL`),
    attributionRef = adminDb.collection("ibaMatrimonialReferrals").doc(uid),
    orderRef = adminDb.collection("consultancyOrders").doc();
  let replay = false;
  await adminDb.runTransaction(async (tx) => {
    const [prior, wallet, entitlement, attribution] = await Promise.all([
      tx.get(requestRef),
      tx.get(walletRef),
      tx.get(entitlementRef),
      tx.get(attributionRef),
    ]);
    if (prior.exists) {
      replay = true;
      return;
    }
    if (entitlement.data()?.status === "ACTIVE")
      throw new ApiError("Matrimonial registration is already active.", 409);
    const balance = Number(wallet.data()?.balance || 0);
    if (balance < price.payableAmount)
      throw new FundsError(price.payableAmount, balance);
    tx.set(
      walletRef,
      { balance: balance - price.payableAmount },
      { merge: true },
    );
    tx.create(orderRef, {
      userId: uid,
      category: "MATRIMONIAL_REGISTRATION",
      ...price,
      status: "PAID",
      paidAt: FieldValue.serverTimestamp(),
    });
    tx.create(adminDb.collection("transactions").doc(), {
      user: uid,
      amount: -price.payableAmount,
      type: "Purchase",
      status: "Completed",
      description: "Matrimonial Bureau Registration",
      category: "MATRIMONIAL_REGISTRATION",
      orderId: orderRef.id,
      date: FieldValue.serverTimestamp(),
    });
    tx.set(entitlementRef, {
      userId: uid,
      type: "MATRIMONIAL",
      status: "ACTIVE",
      activatedAt: FieldValue.serverTimestamp(),
      orderId: orderRef.id,
    });
    if (attribution.exists)
      throw new ApiError(
        "Matrimonial referral attribution is already locked.",
        409,
      );
    tx.create(attributionRef, {
      customerId: uid,
      ibaUid: referral?.ibaUid || null,
      referralCode: referral?.referralCode || null,
      referralSource: referral ? "IBA_CODE" : "DIRECT",
      confirmationStatus: referral ? "CUSTOMER_CONFIRMED" : "NOT_APPLICABLE",
      attributionStatus: "LOCKED",
      registrationOrderId: orderRef.id,
      registeredAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.create(requestRef, {
      userId: uid,
      orderId: orderRef.id,
      createdAt: FieldValue.serverTimestamp(),
    });
    for (const doc of published) {
      const acceptanceRef = adminDb
        .collection("consultancyAcceptances")
        .doc(`${uid}_${doc.id}_${orderRef.id}`);
      tx.create(acceptanceRef, {
        userId: uid,
        documentId: doc.data()!.documentId,
        documentVersionId: doc.id,
        version: doc.data()!.version,
        serviceReference: orderRef.id,
        acceptanceMethod: "AFFIRMATIVE_CHECKBOX",
        acceptedAt: FieldValue.serverTimestamp(),
      });
    }
    audit(
      tx,
      uid,
      "MATRIMONIAL_REGISTERED",
      "consultancyEntitlements",
      entitlementRef.id,
      null,
      { orderId: orderRef.id },
    );
    audit(
      tx,
      uid,
      "MATRIMONIAL_REFERRAL_LOCKED",
      "ibaMatrimonialReferrals",
      attributionRef.id,
      null,
      {
        ibaUid: referral?.ibaUid || null,
        referralSource: referral ? "IBA_CODE" : "DIRECT",
      },
    );
    if (referral)
      notify(
        tx,
        referral.ibaUid,
        "matrimonial_referral_confirmed",
        "A customer confirmed your IBA referral for Matrimonial Bureau registration.",
      );
  });
  return NextResponse.json({
    success: true,
    replayed: replay,
    orderId: orderRef.id,
    pricing: price,
  });
}
async function saveProfile(uid: string, profile: Record<string, unknown>) {
  const entitlement = await adminDb
    .collection("consultancyEntitlements")
    .doc(`${uid}_MATRIMONIAL`)
    .get();
  if (entitlement.data()?.status !== "ACTIVE")
    throw new ApiError("Complete paid registration first.", 403);
  const fieldsSnap = await adminDb
    .collection("consultancyProfileFields")
    .where("active", "==", true)
    .get();
  const fields: any[] = fieldsSnap.empty
    ? defaultProfileFields
    : fieldsSnap.docs.map((d) => d.data());
  const allowed = new Set(
    fields.filter((f) => f.customerEditable).map((f) => f.key),
  );
  const clean = Object.fromEntries(
    Object.entries(profile).filter(([key]) => allowed.has(key)),
  );
  for (const field of fields.filter((f) => f.required)) {
    if (!String(clean[field.key] ?? "").trim())
      throw new ApiError(`${field.label} is required.`, 400);
  }
  const ref = adminDb.collection("matrimonialProfiles").doc(uid);
  await adminDb.runTransaction(async (tx) => {
    const old = await tx.get(ref);
    tx.set(
      ref,
      {
        ...clean,
        userId: uid,
        status: old.data()?.status || "PENDING_VERIFICATION",
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: old.data()?.createdAt || FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    audit(
      tx,
      uid,
      "MATRIMONIAL_PROFILE_SAVED",
      "matrimonialProfiles",
      uid,
      null,
      { changedKeys: Object.keys(clean) },
    );
  });
  return NextResponse.json({ success: true });
}
async function submitVerification(uid: string, body: any) {
  const ref = adminDb.collection("consultancyVerifications").doc(uid);
  await ref.set(
    {
      userId: uid,
      status: "SUBMITTED",
      requestedTypes: (await config()).requiredVerificationTypes,
      submittedReferences: Array.isArray(body.documentReferences)
        ? body.documentReferences
        : [],
      submittedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return NextResponse.json({ success: true, status: "SUBMITTED" });
}
async function matches(uid: string) {
  const [fieldsSnap, profiles] = await Promise.all([
    adminDb
      .collection("consultancyProfileFields")
      .where("active", "==", true)
      .get(),
    adminDb
      .collection("matrimonialProfiles")
      .where("status", "==", "ACTIVE")
      .limit(50)
      .get(),
  ]);
  const fields: any[] = fieldsSnap.empty
    ? defaultProfileFields
    : fieldsSnap.docs.map((d) => d.data());
  const visible = fields
    .filter((f) => f.visibility === "MATCH" || f.visibility === "PUBLIC")
    .map((f) => f.key);
  return NextResponse.json({
    matches: profiles.docs
      .filter((d) => d.id !== uid)
      .map((d) =>
        sanitizeMatrimonialProfile({ id: d.id, ...d.data() }, visible),
      ),
  });
}
async function expressInterest(uid: string, target: string) {
  if (!target || target === uid) throw new ApiError("Invalid profile.", 400);
  const targetProfile = await adminDb
    .collection("matrimonialProfiles")
    .doc(target)
    .get();
  if (targetProfile.data()?.status !== "ACTIVE")
    throw new ApiError("Profile is unavailable.", 404);
  const ref = adminDb
    .collection("matrimonialInterests")
    .doc(`${uid}_${target}`);
  await adminDb.runTransaction(async (tx) => {
    const prior = await tx.get(ref);
    if (prior.exists) return;
    tx.create(ref, {
      fromUserId: uid,
      toUserId: target,
      status: "PENDING",
      createdAt: FieldValue.serverTimestamp(),
    });
    notify(
      tx,
      target,
      "matrimonial_interest",
      "You received a new matrimonial profile interest.",
    );
  });
  return NextResponse.json({ success: true, interestId: ref.id });
}
async function respondInterest(uid: string, id: string, response: string) {
  if (!["ACCEPTED", "REJECTED"].includes(response))
    throw new ApiError("Invalid response.", 400);
  const ref = adminDb.collection("matrimonialInterests").doc(id);
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (
      !snap.exists ||
      snap.data()?.toUserId !== uid ||
      snap.data()?.status !== "PENDING"
    )
      throw new ApiError("Interest is unavailable.", 404);
    tx.update(ref, {
      status: response,
      respondedAt: FieldValue.serverTimestamp(),
    });
    notify(
      tx,
      snap.data()!.fromUserId,
      "matrimonial_interest_response",
      response === "ACCEPTED"
        ? "Your profile interest was accepted. Contact details remain private until the meeting workflow is completed."
        : "Your profile interest was declined.",
    );
    if (response === "ACCEPTED")
      tx.set(
        adminDb
          .collection("matrimonialMutualInterests")
          .doc([snap.data()!.fromUserId, uid].sort().join("_")),
        {
          participantIds: [snap.data()!.fromUserId, uid].sort(),
          status: "ACTIVE",
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
  });
  return NextResponse.json({ success: true });
}
async function requestMeeting(uid: string, body: any) {
  const target = String(body.targetUserId || ""),
    key = String(body.requestId || "");
  validateKey(key);
  const pair = [uid, target].sort();
  if (!target || target === uid)
    throw new ApiError("Invalid participant.", 400);
  const mutualRef = adminDb
      .collection("matrimonialMutualInterests")
      .doc(pair.join("_")),
    requestRef = adminDb
      .collection("consultancyActionRequests")
      .doc(`${uid}_${key}`),
    ref = adminDb.collection("matrimonialMeetings").doc();
  let meetingId = ref.id,
    replayed = false;
  await adminDb.runTransaction(async (tx) => {
    const [mutual, prior] = await Promise.all([
      tx.get(mutualRef),
      tx.get(requestRef),
    ]);
    if (prior.exists) {
      meetingId = prior.data()!.meetingId;
      replayed = true;
      return;
    }
    if (mutual.data()?.status !== "ACTIVE")
      throw new ApiError("Mutual interest is required.", 409);
    tx.create(ref, {
      participantIds: pair,
      requestedBy: uid,
      status: "CONSENT_PENDING",
      participantConsents: { [uid]: true, [target]: false },
      participantPayments: { [uid]: false, [target]: false },
      requestId: key,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.create(requestRef, {
      userId: uid,
      meetingId: ref.id,
      createdAt: FieldValue.serverTimestamp(),
    });
    notify(
      tx,
      target,
      "matrimonial_meeting_request",
      "A mutual match requested a profile meeting. Your separate consent and payment are required.",
    );
  });
  return NextResponse.json({ success: true, meetingId, replayed });
}
async function consentMeeting(uid: string, id: string, consent: boolean) {
  const ref = adminDb.collection("matrimonialMeetings").doc(id);
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref),
      d: any = snap.data();
    if (
      !snap.exists ||
      !d.participantIds?.includes(uid) ||
      d.status !== "CONSENT_PENDING"
    )
      throw new ApiError("Meeting request is unavailable.", 404);
    if (!consent) {
      tx.update(ref, {
        status: "CANCELLED",
        cancelledBy: uid,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return;
    }
    const consents = { ...(d.participantConsents || {}), [uid]: true };
    tx.update(ref, {
      participantConsents: consents,
      status: d.participantIds.every((x: string) => consents[x])
        ? "PAYMENT_PENDING"
        : "CONSENT_PENDING",
      updatedAt: FieldValue.serverTimestamp(),
    });
    for (const participantId of d.participantIds) {
      if (participantId !== uid)
        notify(
          tx,
          participantId,
          consent ? "meeting_consent" : "meeting_cancelled",
          consent
            ? "The other participant consented to the meeting request."
            : "The meeting request was declined.",
        );
    }
  });
  return NextResponse.json({ success: true });
}
async function payMeeting(uid: string, id: string, key: string) {
  validateKey(key);
  const [cfg, commissionPolicy] = await Promise.all([
      config(),
      loadMatrimonialCommissionPolicy(new Date()),
    ]),
    price = calculateFee(cfg.meetingFee),
    meetingRef = adminDb.collection("matrimonialMeetings").doc(id),
    walletRef = adminDb.collection("wallets").doc(uid),
    paymentRef = adminDb
      .collection("meetingParticipantPayments")
      .doc(meetingPaymentId(id, uid)),
    requestRef = adminDb
      .collection("consultancyPaymentRequests")
      .doc(`${uid}_${key}`),
    attributionRef = adminDb.collection("ibaMatrimonialReferrals").doc(uid),
    paymentTransactionRef = adminDb.collection("transactions").doc();
  let replay = false;
  await adminDb.runTransaction(async (tx) => {
    const [meeting, wallet, payment, prior, attribution] = await Promise.all([
      tx.get(meetingRef),
      tx.get(walletRef),
      tx.get(paymentRef),
      tx.get(requestRef),
      tx.get(attributionRef),
    ]);
    const d: any = meeting.data();
    if (prior.exists || payment.data()?.status === "PAID") {
      replay = true;
      return;
    }
    if (
      !meeting.exists ||
      !d.participantIds?.includes(uid) ||
      d.status !== "PAYMENT_PENDING" ||
      !d.participantConsents?.[uid]
    )
      throw new ApiError("Meeting is not ready for this payment.", 409);
    const balance = Number(wallet.data()?.balance || 0);
    if (balance < price.payableAmount)
      throw new FundsError(price.payableAmount, balance);
    const payments = { ...(d.participantPayments || {}), [uid]: true };
    const referral = attribution.data();
    const ibaChecks = referral?.ibaUid
      ? await Promise.all([
          tx.get(adminDb.collection("users").doc(referral.ibaUid)),
          tx.get(adminDb.collection("ibaEligibility").doc(referral.ibaUid)),
        ])
      : null;
    tx.set(
      walletRef,
      { balance: balance - price.payableAmount },
      { merge: true },
    );
    tx.create(paymentRef, {
      meetingId: id,
      userId: uid,
      ...price,
      status: "PAID",
      transactionId: paymentTransactionRef.id,
      paidAt: FieldValue.serverTimestamp(),
    });
    tx.create(paymentTransactionRef, {
      user: uid,
      amount: -price.payableAmount,
      type: "Purchase",
      status: "Completed",
      description: "Profile Meeting Fee",
      category: "PROFILE_MEETING",
      meetingId: id,
      date: FieldValue.serverTimestamp(),
    });
    createMatrimonialCommission(tx, {
      event: "PROFILE_MEETING",
      customerId: uid,
      meetingId: id,
      matchId: null,
      qualifyingPaymentId: paymentTransactionRef.id,
      qualifyingAmount: price.payableAmount,
      attribution,
      ibaUser: ibaChecks?.[0] || null,
      ibaEligibility: ibaChecks?.[1] || null,
      policy: commissionPolicy,
    });
    tx.update(meetingRef, {
      participantPayments: payments,
      status: d.participantIds.every((x: string) => payments[x])
        ? "VERIFICATION_PENDING"
        : "PAYMENT_PENDING",
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.create(requestRef, {
      userId: uid,
      meetingId: id,
      paymentId: paymentRef.id,
      createdAt: FieldValue.serverTimestamp(),
    });
    if (d.participantIds.every((x: string) => payments[x]))
      for (const participantId of d.participantIds)
        notify(
          tx,
          participantId,
          "meeting_admin_review",
          "Both meeting fees are paid. Verification and Admin contact-release review are pending.",
        );
  });
  return NextResponse.json({ success: true, replayed: replay, pricing: price });
}
async function contact(uid: string, meetingId: string) {
  const meeting = await adminDb
      .collection("matrimonialMeetings")
      .doc(meetingId)
      .get(),
    d: any = meeting.data();
  if (
    !meeting.exists ||
    !d.participantIds?.includes(uid) ||
    !["CONTACT_APPROVED", "CONFIRMED", "COMPLETED"].includes(d.status) ||
    !d.contactSharingApproval
  )
    throw new ApiError("Contact sharing has not been approved.", 403);
  const other = d.participantIds.find((x: string) => x !== uid),
    profile = await adminDb.collection("matrimonialProfiles").doc(other).get();
  const permitted: string[] = d.contactSharingApproval.categories || [];
  const data: any = profile.data() || {};
  const contactField: Record<string, string> = {
    PHONE: "mobile",
    EMAIL: "email",
    WHATSAPP: "whatsapp",
  };
  return NextResponse.json({
    contact: Object.fromEntries(
      permitted
        .map((category) => {
          const key = contactField[category] || category.toLowerCase();
          return [key, data[key]];
        })
        .filter(([, v]) => v),
    ),
  });
}
async function bookCounselling(uid: string, body: any) {
  const cfg = await config();
  if (!cfg.enabled || !cfg.counsellingEnabled)
    throw new ApiError("Counselling booking is unavailable.", 503);
  const service = await adminDb
    .collection("counsellingServices")
    .doc(String(body.serviceId || ""))
    .get();
  if (!service.exists || service.data()?.enabled !== true)
    throw new ApiError("Counselling service is unavailable.", 404);
  const ids = Array.isArray(body.acceptedDocumentVersionIds)
    ? body.acceptedDocumentVersionIds.filter(
        (x: unknown) => typeof x === "string",
      )
    : [];
  const acceptedDocs = await Promise.all(
    ids.map((id: string) =>
      adminDb.collection("consultancyDocumentVersions").doc(id).get(),
    ),
  );
  const published = acceptedDocs.filter(
    (d) => d.exists && d.data()?.status === "PUBLISHED",
  );
  const acceptedTypes = new Set(published.map((d) => d.data()?.type));
  if (requiredCounsellingDocuments.some((type) => !acceptedTypes.has(type)))
    throw new ApiError(
      "All current counselling terms, disclaimer, privacy notice and Code of Conduct must be affirmatively accepted.",
      400,
    );
  const start = new Date(body.startsAt);
  if (
    !Number.isFinite(start.getTime()) ||
    start.getTime() < Date.now() + cfg.bookingLeadHours * 3600000
  )
    throw new ApiError(
      "Select an available future slot after the booking lead time.",
      400,
    );
  const { day, time } = indiaDateTime(start),
    availabilityRef = adminDb.collection("counsellingAvailability").doc(day),
    slotKey = `${body.serviceId}_${start.toISOString()}`,
    slotRef = adminDb.collection("counsellingSlots").doc(slotKey),
    counterRef = adminDb
      .collection("counsellingDayCounters")
      .doc(`${body.serviceId}_${day}`),
    walletRef = adminDb.collection("wallets").doc(uid),
    requestRef = adminDb
      .collection("consultancyPaymentRequests")
      .doc(`${uid}_${body.idempotencyKey}`),
    bookingRef = adminDb.collection("counsellingBookings").doc();
  validateKey(String(body.idempotencyKey || ""));
  const pricing = calculateCounsellingPayment(
    service.data()!.fee,
    service.data()!.advancePercentage ?? cfg.counsellingAdvancePercentage,
  );
  const availability = await availabilityRef.get();
  const availabilityData = availability.data();
  if (
    !availability.exists ||
    availabilityData?.blocked === true ||
    !Array.isArray(availabilityData?.slots) ||
    !availabilityData!.slots.includes(time)
  )
    throw new ApiError(
      "The selected time is not an available Admin slot.",
      409,
    );
  await adminDb.runTransaction(async (tx) => {
    const [slot, wallet, prior, counter] = await Promise.all([
      tx.get(slotRef),
      tx.get(walletRef),
      tx.get(requestRef),
      tx.get(counterRef),
    ]);
    if (prior.exists) return;
    if (slot.exists)
      throw new ApiError("This slot has already been booked.", 409);
    const dailyCount = Number(counter.data()?.count || 0);
    if (dailyCount >= cfg.maxDailySessions)
      throw new ApiError("Maximum daily sessions have been reached.", 409);
    const balance = Number(wallet.data()?.balance || 0);
    if (balance < pricing.advanceAmount)
      throw new FundsError(pricing.advanceAmount, balance);
    tx.set(
      walletRef,
      { balance: balance - pricing.advanceAmount },
      { merge: true },
    );
    tx.create(slotRef, {
      serviceId: service.id,
      startsAt: start,
      userId: uid,
      bookingId: bookingRef.id,
      status: "RESERVED",
      day,
    });
    tx.set(
      counterRef,
      { serviceId: service.id, day, count: dailyCount + 1 },
      { merge: true },
    );
    tx.create(bookingRef, {
      userId: uid,
      serviceId: service.id,
      serviceName: service.data()!.name,
      startsAt: start,
      day,
      status: "CONFIRMED",
      ...pricing,
      advancePaid: pricing.advanceAmount,
      balanceDue: pricing.balanceAmount,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.create(adminDb.collection("transactions").doc(), {
      user: uid,
      amount: -pricing.advanceAmount,
      type: "Purchase",
      status: "Completed",
      description: `Counselling Advance: ${service.data()!.name}`,
      category: "COUNSELLING_ADVANCE",
      bookingId: bookingRef.id,
      date: FieldValue.serverTimestamp(),
    });
    tx.create(requestRef, {
      userId: uid,
      bookingId: bookingRef.id,
      createdAt: FieldValue.serverTimestamp(),
    });
    for (const document of published) {
      tx.create(
        adminDb
          .collection("consultancyAcceptances")
          .doc(`${uid}_${document.id}_${bookingRef.id}`),
        {
          userId: uid,
          documentId: document.data()!.documentId,
          documentVersionId: document.id,
          version: document.data()!.version,
          serviceReference: bookingRef.id,
          acceptanceMethod: "AFFIRMATIVE_CHECKBOX",
          acceptedAt: FieldValue.serverTimestamp(),
        },
      );
    }
    audit(
      tx,
      uid,
      "COUNSELLING_BOOKED",
      "counsellingBookings",
      bookingRef.id,
      null,
      { serviceId: service.id, startsAt: start.toISOString() },
    );
  });
  return NextResponse.json({
    success: true,
    bookingId: bookingRef.id,
    pricing,
  });
}
async function reportConcern(uid: string, body: any) {
  const cfg = await config();
  if (!cfg.complaintCategories.includes(body.category))
    throw new ApiError("Invalid concern category.", 400);
  if (!String(body.description || "").trim())
    throw new ApiError("Description is required.", 400);
  const ref = adminDb.collection("consultancyComplaints").doc();
  await ref.create({
    reportedBy: uid,
    category: body.category,
    description: String(body.description).slice(0, 5000),
    relatedEntityType: body.relatedEntityType || null,
    relatedEntityId: body.relatedEntityId || null,
    evidencePaths: Array.isArray(body.evidencePaths) ? body.evidencePaths : [],
    status: "SUBMITTED",
    guiltDetermined: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ success: true, complaintId: ref.id });
}

async function payCounsellingBalance(uid: string, body: any) {
  const bookingRef = adminDb
      .collection("counsellingBookings")
      .doc(String(body.bookingId || "")),
    walletRef = adminDb.collection("wallets").doc(uid),
    key = String(body.idempotencyKey || ""),
    requestRef = adminDb
      .collection("consultancyPaymentRequests")
      .doc(`${uid}_${key}`);
  validateKey(key);
  let replayed = false;
  await adminDb.runTransaction(async (tx) => {
    const [booking, wallet, prior] = await Promise.all([
      tx.get(bookingRef),
      tx.get(walletRef),
      tx.get(requestRef),
    ]);
    if (prior.exists || Number(booking.data()?.balanceDue || 0) === 0) {
      replayed = true;
      return;
    }
    if (
      !booking.exists ||
      booking.data()?.userId !== uid ||
      !["CONFIRMED", "RESCHEDULED"].includes(booking.data()?.status)
    )
      throw new ApiError("This counselling balance is not payable.", 409);
    const due = Number(booking.data()?.balanceDue || 0),
      balance = Number(wallet.data()?.balance || 0);
    if (balance < due) throw new FundsError(due, balance);
    tx.set(walletRef, { balance: balance - due }, { merge: true });
    tx.update(bookingRef, {
      balanceDue: 0,
      balancePaid: due,
      fullyPaidAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.create(adminDb.collection("transactions").doc(), {
      user: uid,
      amount: -due,
      type: "Purchase",
      status: "Completed",
      description: `Counselling Balance: ${booking.data()?.serviceName || "Service"}`,
      category: "COUNSELLING_BALANCE",
      bookingId: bookingRef.id,
      date: FieldValue.serverTimestamp(),
    });
    tx.create(requestRef, {
      userId: uid,
      bookingId: bookingRef.id,
      createdAt: FieldValue.serverTimestamp(),
    });
    audit(
      tx,
      uid,
      "COUNSELLING_BALANCE_PAID",
      "counsellingBookings",
      bookingRef.id,
      { balanceDue: due },
      { balanceDue: 0 },
    );
  });
  return NextResponse.json({ success: true, replayed });
}
async function disputeSuccessFee(uid: string, body: any) {
  const ref = adminDb
    .collection("successFeeObligations")
    .doc(String(body.obligationId || ""));
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (
      !snap.exists ||
      snap.data()?.userId !== uid ||
      !["DUE", "OUTSTANDING", "PARTIALLY_PAID"].includes(snap.data()?.status)
    )
      throw new ApiError("This obligation cannot be disputed.", 409);
    tx.update(ref, {
      status: "DISPUTED",
      disputeReason: String(body.reason || "").slice(0, 3000),
      disputedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    audit(
      tx,
      uid,
      "SUCCESS_FEE_DISPUTED",
      "successFeeObligations",
      ref.id,
      null,
      { reasonProvided: Boolean(body.reason) },
    );
  });
  return NextResponse.json({ success: true });
}

async function paySuccessFee(uid: string, body: any) {
  const commissionPolicy = await loadMatrimonialCommissionPolicy(new Date()),
    obligationRef = adminDb
      .collection("successFeeObligations")
      .doc(String(body.obligationId || "")),
    walletRef = adminDb.collection("wallets").doc(uid),
    requestRef = adminDb
      .collection("consultancyPaymentRequests")
      .doc(`${uid}_${body.idempotencyKey}`),
    attributionRef = adminDb.collection("ibaMatrimonialReferrals").doc(uid),
    paymentTransactionRef = adminDb.collection("transactions").doc();
  validateKey(String(body.idempotencyKey || ""));
  let replayed = false;
  await adminDb.runTransaction(async (tx) => {
    const [obligation, wallet, requestDoc, attribution] = await Promise.all([
      tx.get(obligationRef),
      tx.get(walletRef),
      tx.get(requestRef),
      tx.get(attributionRef),
    ]);
    if (requestDoc.exists || obligation.data()?.status === "PAID") {
      replayed = true;
      return;
    }
    if (
      !obligation.exists ||
      obligation.data()?.userId !== uid ||
      !["DUE", "OUTSTANDING", "PARTIALLY_PAID"].includes(
        obligation.data()?.status,
      )
    )
      throw new ApiError(
        "Success Fee is not payable in its current state.",
        409,
      );
    const due = Math.max(
      0,
      Number(obligation.data()?.payableAmount || 0) -
        Number(obligation.data()?.paidAmount || 0),
    );
    const balance = Number(wallet.data()?.balance || 0);
    if (balance < due) throw new FundsError(due, balance);
    const referral = attribution.data();
    const ibaChecks = referral?.ibaUid
      ? await Promise.all([
          tx.get(adminDb.collection("users").doc(referral.ibaUid)),
          tx.get(adminDb.collection("ibaEligibility").doc(referral.ibaUid)),
        ])
      : null;
    tx.set(walletRef, { balance: balance - due }, { merge: true });
    tx.update(obligationRef, {
      status: "PAID",
      paidAmount: Number(obligation.data()?.paidAmount || 0) + due,
      paymentTransactionId: paymentTransactionRef.id,
      paidAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.create(paymentTransactionRef, {
      user: uid,
      amount: -due,
      type: "Purchase",
      status: "Completed",
      description: "Marriage Success Fee",
      category: "MARRIAGE_SUCCESS_FEE",
      obligationId: obligationRef.id,
      matchId: obligation.data()?.matchId,
      date: FieldValue.serverTimestamp(),
    });
    createMatrimonialCommission(tx, {
      event: "MARRIAGE_FIXED",
      customerId: uid,
      meetingId: null,
      matchId: obligation.data()?.matchId || null,
      qualifyingPaymentId: paymentTransactionRef.id,
      qualifyingAmount: due,
      attribution,
      ibaUser: ibaChecks?.[0] || null,
      ibaEligibility: ibaChecks?.[1] || null,
      policy: commissionPolicy,
    });
    tx.create(requestRef, {
      userId: uid,
      obligationId: obligationRef.id,
      createdAt: FieldValue.serverTimestamp(),
    });
    audit(
      tx,
      uid,
      "SUCCESS_FEE_PAID",
      "successFeeObligations",
      obligationRef.id,
      obligation.data()?.status,
      { status: "PAID", amount: due },
    );
  });
  return NextResponse.json({ success: true, replayed });
}

async function validateMatrimonialReferral(code: string) {
  const referral = await resolveEligibleIba(code.trim().toUpperCase());
  if (!referral) return NextResponse.json({ valid: false, eligible: false });
  return NextResponse.json({
    valid: true,
    eligible: true,
    referralCode: referral.referralCode,
    displayName: referral.displayName,
  });
}

async function resolveEligibleIba(code: string) {
  if (!code) return null;
  const wallets = await adminDb
    .collection("wallets")
    .where("referralCode", "==", code)
    .limit(1)
    .get();
  if (wallets.empty) return null;
  const wallet = wallets.docs[0];
  const [user, eligibility] = await Promise.all([
    adminDb.collection("users").doc(wallet.id).get(),
    adminDb.collection("ibaEligibility").doc(wallet.id).get(),
  ]);
  const userData = user.data() || {};
  if (
    !user.exists ||
    userData.purchasedMockTest !== true ||
    ["SUSPENDED", "INACTIVE"].includes(userData.accountStatus) ||
    eligibility.data()?.status === "SUSPENDED"
  )
    return null;
  return {
    ibaUid: wallet.id,
    referralCode: code,
    displayName: String(
      userData.name || userData.displayName || "Verified IBA",
    ).slice(0, 80),
  };
}

async function loadMatrimonialCommissionPolicy(at: Date) {
  const snapshot = await adminDb
    .collection("ibaMatrimonialCommissionPolicies")
    .where("status", "==", "PUBLISHED")
    .get();
  const selected = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((value) =>
      isPolicyEffective(value as MatrimonialCommissionPolicy, at),
    )
    .sort(
      (a: any, b: any) => Number(b.version || 0) - Number(a.version || 0),
    )[0];
  return selected ? (selected as MatrimonialCommissionPolicy) : null;
}

function createMatrimonialCommission(
  tx: FirebaseFirestore.Transaction,
  input: {
    event: MatrimonialCommissionEvent;
    customerId: string;
    meetingId: string | null;
    matchId: string | null;
    qualifyingPaymentId: string;
    qualifyingAmount: number;
    attribution: FirebaseFirestore.DocumentSnapshot;
    ibaUser: FirebaseFirestore.DocumentSnapshot | null;
    ibaEligibility: FirebaseFirestore.DocumentSnapshot | null;
    policy: MatrimonialCommissionPolicy | null;
  },
) {
  const attribution = input.attribution.data();
  if (
    !input.policy ||
    !input.attribution.exists ||
    attribution?.attributionStatus !== "LOCKED" ||
    !attribution?.ibaUid
  )
    return;
  const rule =
      input.event === "PROFILE_MEETING"
        ? input.policy.profileMeeting
        : input.policy.marriageFixed,
    amount = calculateMatrimonialCommission(input.qualifyingAmount, rule);
  if (!rule.enabled || amount <= 0) return;
  const user = input.ibaUser?.data() || {},
    eligible =
      input.ibaUser?.exists === true &&
      user.purchasedMockTest === true &&
      !["SUSPENDED", "INACTIVE"].includes(user.accountStatus) &&
      input.ibaEligibility?.data()?.status !== "SUSPENDED",
    status = eligible ? "ELIGIBLE" : "ON_HOLD",
    id = commissionRecordId(input.event, input.qualifyingPaymentId),
    ref = adminDb.collection("ibaMatrimonialCommissions").doc(id);
  tx.create(ref, {
    ibaUid: attribution.ibaUid,
    customerId: input.customerId,
    referralAttributionId: input.attribution.id,
    matrimonialProfileId: input.customerId,
    meetingId: input.meetingId,
    matchId: input.matchId,
    qualifyingPaymentTransactionId: input.qualifyingPaymentId,
    sourceType:
      input.event === "PROFILE_MEETING"
        ? "MATRIMONIAL_PROFILE_MEETING"
        : "MATRIMONIAL_MARRIAGE_FIXED",
    commissionType: input.event,
    qualifyingAmount: input.qualifyingAmount,
    commissionRuleType: rule.type,
    commissionRuleValue: rule.value,
    commissionAmount: amount,
    ruleVersion: input.policy.version,
    policyId: input.policy.id || null,
    policySnapshot: rule,
    status,
    ineligibilityReason: eligible ? null : "IBA_NOT_ACTIVE_OR_ELIGIBLE",
    eligibleAt: eligible ? FieldValue.serverTimestamp() : null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  audit(
    tx,
    "SYSTEM",
    "IBA_MATRIMONIAL_COMMISSION_CREATED",
    "ibaMatrimonialCommissions",
    id,
    null,
    {
      ibaUid: attribution.ibaUid,
      event: input.event,
      qualifyingPaymentTransactionId: input.qualifyingPaymentId,
      amount,
      status,
    },
  );
  notify(
    tx,
    attribution.ibaUid,
    "matrimonial_commission_created",
    eligible
      ? "A matrimonial referral commission became eligible for review."
      : "A matrimonial referral commission is on hold pending IBA eligibility review.",
  );
}

function indiaDateTime(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return {
    day: `${value.year}-${value.month}-${value.day}`,
    time: `${value.hour}:${value.minute}`,
  };
}

function audit(
  tx: FirebaseFirestore.Transaction,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  previousValue: any,
  newValue: any,
) {
  tx.create(adminDb.collection("consultancyAuditLogs").doc(), {
    actorId,
    action,
    entityType,
    entityId,
    previousValue,
    newValue,
    createdAt: FieldValue.serverTimestamp(),
  });
}

function notify(
  tx: FirebaseFirestore.Transaction,
  userId: string,
  type: string,
  message: string,
) {
  tx.create(adminDb.collection("notifications").doc(), {
    userId,
    type,
    message,
    status: "unread",
    timestamp: FieldValue.serverTimestamp(),
  });
}
function docs(s: FirebaseFirestore.QuerySnapshot) {
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
}
function validateKey(key: string) {
  if (!/^[A-Za-z0-9_-]{12,100}$/.test(key))
    throw new ApiError("Invalid request identifier.", 400);
}
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
class FundsError extends ApiError {
  constructor(
    public price: number,
    public balance: number,
  ) {
    super("Insufficient Wallet Balance", 409);
  }
}
function fail(error: unknown) {
  if (error instanceof FundsError)
    return NextResponse.json(
      {
        error: error.message,
        price: error.price,
        balance: error.balance,
        required: error.price - error.balance,
      },
      { status: error.status },
    );
  const status =
    error instanceof RequestAuthError || error instanceof ApiError
      ? error.status
      : 500;
  console.error("Consultancy API failed", error);
  return NextResponse.json(
    {
      error:
        error instanceof Error ? error.message : "Consultancy request failed.",
    },
    { status },
  );
}
