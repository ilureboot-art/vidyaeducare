import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/admin-init";
import { RequestAuthError, verifyRequester } from "@/lib/server-auth";
import {
  calculateFee,
  CONSULTANCY_CONFIG_ID,
  ConsultancyConfig,
  defaultConsultancyConfig,
  defaultCounsellingServices,
  defaultProfileFields,
  requiredMatrimonialDocuments,
  successObligationId,
  validateConsultancyConfig,
} from "@/lib/consultancy";
import {
  defaultMatrimonialCommissionPolicy,
  MatrimonialCommissionPolicy,
  validateMatrimonialCommissionPolicy,
} from "@/lib/matrimonial-iba-commission";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    await verifyRequester(request, true);
    const [
      config,
      profiles,
      verifications,
      meetings,
      matches,
      obligations,
      services,
      bookings,
      documents,
      complaints,
      audits,
      profileFields,
      availability,
      commissionPolicies,
      referrals,
      matrimonialCommissions,
    ] = await Promise.all([
      adminDb.collection("configs").doc(CONSULTANCY_CONFIG_ID).get(),
      adminDb.collection("matrimonialProfiles").limit(200).get(),
      adminDb.collection("consultancyVerifications").limit(200).get(),
      adminDb.collection("matrimonialMeetings").limit(200).get(),
      adminDb.collection("marriageMatches").limit(200).get(),
      adminDb.collection("successFeeObligations").limit(300).get(),
      adminDb.collection("counsellingServices").limit(100).get(),
      adminDb.collection("counsellingBookings").limit(300).get(),
      adminDb.collection("consultancyDocumentVersions").limit(300).get(),
      adminDb.collection("consultancyComplaints").limit(300).get(),
      adminDb
        .collection("consultancyAuditLogs")
        .orderBy("createdAt", "desc")
        .limit(100)
        .get(),
      adminDb.collection("consultancyProfileFields").limit(200).get(),
      adminDb.collection("counsellingAvailability").limit(366).get(),
      adminDb
        .collection("ibaMatrimonialCommissionPolicies")
        .orderBy("version", "desc")
        .limit(50)
        .get(),
      adminDb.collection("ibaMatrimonialReferrals").limit(500).get(),
      adminDb
        .collection("ibaMatrimonialCommissions")
        .orderBy("createdAt", "desc")
        .limit(1000)
        .get(),
    ]);
    const cfg = config.exists
      ? { ...defaultConsultancyConfig, ...config.data() }
      : defaultConsultancyConfig;
    return NextResponse.json({
      config: cfg,
      profiles: docs(profiles),
      verifications: docs(verifications),
      meetings: docs(meetings),
      matches: docs(matches),
      obligations: docs(obligations),
      services: docs(services),
      bookings: docs(bookings),
      documents: docs(documents),
      complaints: docs(complaints),
      audits: docs(audits),
      profileFields: docs(profileFields),
      availability: docs(availability),
      commissionPolicies: docs(commissionPolicies),
      referrals: docs(referrals),
      matrimonialCommissions: docs(matrimonialCommissions),
      metrics: metrics(
        profiles,
        verifications,
        meetings,
        matches,
        obligations,
        services,
        bookings,
        complaints,
      ),
    });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyRequester(request, true),
      body = await request.json();
    switch (body.action) {
      case "SAVE_CONFIG":
        return saveConfig(admin.uid, body.config);
      case "SEED_DEFAULTS":
        return seedDefaults(admin.uid);
      case "SAVE_PROFILE_FIELD":
        return saveProfileField(admin.uid, body.field);
      case "VERIFY_PROFILE":
        return verifyProfile(admin.uid, body);
      case "APPROVE_CONTACT":
        return approveContact(admin.uid, body);
      case "COMPLETE_MEETING":
        return completeMeeting(admin.uid, body.meetingId);
      case "CONFIRM_MARRIAGE":
        return confirmMarriage(admin.uid, body);
      case "SUCCESS_FEE_ACTION":
        return successAction(admin.uid, body);
      case "SAVE_SERVICE":
        return saveService(admin.uid, body.service);
      case "SET_SERVICE_STATUS":
        return setServiceStatus(
          admin.uid,
          String(body.serviceId || ""),
          Boolean(body.enabled),
        );
      case "SET_MATRIMONIAL_STATUS":
        return setMatrimonialStatus(admin.uid, Boolean(body.enabled));
      case "SAVE_AVAILABILITY":
        return saveAvailability(admin.uid, body.availability);
      case "SAVE_DOCUMENT":
        return saveDocument(admin.uid, body.document);
      case "PUBLISH_DOCUMENT":
        return publishDocument(admin.uid, body.versionId);
      case "COMPLAINT_DECISION":
        return complaintDecision(admin.uid, body);
      case "AI_DRAFT":
        return aiDraft(body);
      case "SAVE_MATRIMONIAL_COMMISSION_POLICY":
        return saveMatrimonialCommissionPolicy(admin.uid, body.policy);
      case "PUBLISH_MATRIMONIAL_COMMISSION_POLICY":
        return publishMatrimonialCommissionPolicy(admin.uid, body.policyId);
      case "OVERRIDE_MATRIMONIAL_REFERRAL":
        return overrideMatrimonialReferral(admin.uid, body);
      case "MATRIMONIAL_COMMISSION_ACTION":
        return matrimonialCommissionAction(admin.uid, body);
      case "REFUND_MATRIMONIAL_PAYMENT":
        return refundMatrimonialPayment(admin.uid, body);
      default:
        return NextResponse.json(
          { error: "Unsupported Admin action." },
          { status: 400 },
        );
    }
  } catch (e) {
    return fail(e);
  }
}

async function saveConfig(uid: string, input: any) {
  const config = { ...defaultConsultancyConfig, ...input } as ConsultancyConfig,
    errors = validateConsultancyConfig(config);
  if (errors.length) throw new ApiError(errors.join(" "), 400);
  const ref = adminDb.collection("configs").doc(CONSULTANCY_CONFIG_ID),
    history = adminDb.collection("consultancyConfigHistory").doc();
  await adminDb.runTransaction(async (tx) => {
    const old = await tx.get(ref);
    tx.create(history, {
      previousValue: old.exists ? old.data() : null,
      newValue: config,
      changedBy: uid,
      changedAt: FieldValue.serverTimestamp(),
    });
    tx.set(ref, {
      ...config,
      updatedBy: uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
    audit(
      tx,
      uid,
      "CONSULTANCY_CONFIG_CHANGED",
      "configs",
      CONSULTANCY_CONFIG_ID,
      null,
      { changed: true },
    );
  });
  return NextResponse.json({ success: true, config });
}
async function seedDefaults(uid: string) {
  const batch = adminDb.batch();
  for (const field of defaultProfileFields)
    batch.set(
      adminDb.collection("consultancyProfileFields").doc(field.key),
      { ...field, active: true, createdAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  for (const service of defaultCounsellingServices)
    batch.set(
      adminDb.collection("counsellingServices").doc(service.id),
      { ...service, createdAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  const starterDocuments = [
    ["MATRIMONIAL_SERVICE_AGREEMENT", "Matrimonial Service Agreement"],
    ["SUCCESS_FEE_UNDERTAKING", "Marriage Success Fee Undertaking"],
    ["PRIVACY_NOTICE", "Privacy Notice"],
    ["CODE_OF_CONDUCT", "Matrimonial Code of Conduct"],
    ["COUNSELLING_SERVICE_AGREEMENT", "Counselling Service Agreement"],
    ["COUNSELLING_DISCLAIMER", "Counselling Disclaimer"],
    ["COUNSELLING_CODE_OF_CONDUCT", "Counselling Code of Conduct"],
    [
      "COUNSELLING_CANCELLATION_POLICY",
      "Counselling Cancellation and Rescheduling Policy",
    ],
  ];
  for (const [type, title] of starterDocuments) {
    const documentId = type.toLowerCase();
    batch.set(
      adminDb.collection("consultancyDocumentVersions").doc(`${documentId}_v1`),
      {
        documentId,
        type,
        title,
        version: 1,
        status: "DRAFT",
        content: "Draft placeholder. Complete legal review before publication.",
        legalReviewNotice: "Draft — Legal Review Recommended",
        createdBy: uid,
        modifiedBy: uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }
  batch.set(
    adminDb.collection("configs").doc(CONSULTANCY_CONFIG_ID),
    {
      ...defaultConsultancyConfig,
      updatedBy: uid,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  batch.set(adminDb.collection("consultancyAuditLogs").doc(), {
    actorId: uid,
    action: "CONSULTANCY_DEFAULTS_SEEDED",
    entityType: "configs",
    entityId: CONSULTANCY_CONFIG_ID,
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  return NextResponse.json({ success: true });
}
async function saveProfileField(uid: string, field: any) {
  if (!field?.key || !/^[A-Za-z][A-Za-z0-9_]{1,60}$/.test(field.key))
    throw new ApiError("Valid field key is required.", 400);
  if (
    [
      "mobile",
      "phone",
      "whatsapp",
      "email",
      "address",
      "fullAddress",
      "residentialAddress",
    ].includes(field.key) &&
    !["PROTECTED", "ADMIN_ONLY"].includes(field.visibility)
  )
    throw new ApiError(
      "Sensitive contact fields must be Protected or Admin Only.",
      400,
    );
  const ref = adminDb.collection("consultancyProfileFields").doc(field.key);
  await ref.set(
    { ...field, updatedBy: uid, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  return NextResponse.json({ success: true });
}
async function verifyProfile(uid: string, body: any) {
  if (
    ![
      "UNDER_VERIFICATION",
      "ADDITIONAL_INFORMATION_REQUIRED",
      "VERIFIED",
      "REJECTED",
    ].includes(body.status)
  )
    throw new ApiError("Invalid verification status.", 400);
  const ref = adminDb.collection("consultancyVerifications").doc(body.userId),
    profile = adminDb.collection("matrimonialProfiles").doc(body.userId);
  await adminDb.runTransaction(async (tx) => {
    const old = await tx.get(ref);
    tx.set(
      ref,
      {
        userId: body.userId,
        status: body.status,
        verifiedTypes: Array.isArray(body.verifiedTypes)
          ? body.verifiedTypes
          : [],
        remarks: body.remarks || null,
        reviewedBy: uid,
        reviewedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    if (body.status === "VERIFIED")
      tx.set(
        profile,
        {
          status: "ACTIVE",
          verificationBadges: (body.verifiedTypes || []).map(
            (x: string) => `${x} verified`,
          ),
        },
        { merge: true },
      );
    if (body.status === "REJECTED")
      tx.set(profile, { status: "REJECTED" }, { merge: true });
    audit(
      tx,
      uid,
      "VERIFICATION_REVIEWED",
      "consultancyVerifications",
      body.userId,
      old.data()?.status || null,
      { status: body.status, verifiedTypes: body.verifiedTypes || [] },
    );
  });
  return NextResponse.json({ success: true });
}
async function approveContact(uid: string, body: any) {
  const ref = adminDb.collection("matrimonialMeetings").doc(body.meetingId);
  await adminDb.runTransaction(async (tx) => {
    const meeting = await tx.get(ref),
      d: any = meeting.data();
    if (
      !meeting.exists ||
      !["VERIFICATION_PENDING", "ADMIN_REVIEW"].includes(d.status) ||
      !d.participantIds?.every((x: string) => d.participantPayments?.[x])
    )
      throw new ApiError(
        "Both payments are required before contact review.",
        409,
      );
    const verifications = await Promise.all(
      d.participantIds.map((x: string) =>
        tx.get(adminDb.collection("consultancyVerifications").doc(x)),
      ),
    );
    if (verifications.some((v) => v.data()?.status !== "VERIFIED"))
      throw new ApiError(
        "Both customers must satisfy required verification.",
        409,
      );
    const cfg = await tx.get(
        adminDb.collection("configs").doc(CONSULTANCY_CONFIG_ID),
      ),
      allowed =
        cfg.data()?.contactCategories ||
        defaultConsultancyConfig.contactCategories,
      categories = (body.categories || []).filter((x: string) =>
        allowed.includes(x),
      );
    if (!categories.length)
      throw new ApiError("Select permitted contact categories.", 400);
    tx.update(ref, {
      status: "CONTACT_APPROVED",
      contactSharingApproval: {
        approvedBy: uid,
        approvedAt: FieldValue.serverTimestamp(),
        categories,
        policyVersion: body.policyVersion || null,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });
    audit(
      tx,
      uid,
      "CONTACT_SHARING_APPROVED",
      "matrimonialMeetings",
      ref.id,
      null,
      {
        participantIds: d.participantIds,
        categories,
        policyVersion: body.policyVersion || null,
      },
    );
  });
  return NextResponse.json({ success: true });
}
async function completeMeeting(uid: string, id: string) {
  const ref = adminDb.collection("matrimonialMeetings").doc(id);
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (
      !snap.exists ||
      !["CONTACT_APPROVED", "CONFIRMED"].includes(snap.data()?.status)
    )
      throw new ApiError("Meeting cannot be completed.", 409);
    tx.update(ref, {
      status: "COMPLETED",
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    audit(
      tx,
      uid,
      "MEETING_COMPLETED",
      "matrimonialMeetings",
      id,
      snap.data()?.status,
      "COMPLETED",
    );
  });
  return NextResponse.json({ success: true });
}
async function confirmMarriage(uid: string, body: any) {
  const participants: string[] = Array.isArray(body.participantIds)
    ? [
        ...new Set<string>(
          body.participantIds.filter((x: unknown) => typeof x === "string"),
        ),
      ].sort()
    : [];
  if (participants.length !== 2)
    throw new ApiError("Exactly two customers are required.", 400);
  const meetingId = String(body.meetingId || "");
  if (!meetingId)
    throw new ApiError(
      "A completed meeting reference is required before marriage confirmation.",
      400,
    );
  const cfg = await loadConfig(),
    pricing = calculateFee(cfg.successFee),
    matchRef = adminDb.collection("marriageMatches").doc();
  await adminDb.runTransaction(async (tx) => {
    const [meeting, ...profiles] = await Promise.all([
      tx.get(adminDb.collection("matrimonialMeetings").doc(meetingId)),
      ...participants.map((x: string) =>
        tx.get(adminDb.collection("matrimonialProfiles").doc(x)),
      ),
    ]);
    const meetingParticipants = [
      ...(meeting.data()?.participantIds || []),
    ].sort();
    if (
      !meeting.exists ||
      meeting.data()?.status !== "COMPLETED" ||
      JSON.stringify(meetingParticipants) !== JSON.stringify(participants)
    )
      throw new ApiError(
        "Marriage confirmation must reference a completed meeting for the same customers.",
        409,
      );
    if (profiles.some((p) => !p.exists))
      throw new ApiError("Customer profile not found.", 404);
    tx.create(matchRef, {
      participantIds: participants,
      status: "CONFIRMED",
      confirmationMethod: body.confirmationMethod || "ADMIN_REVIEW",
      confirmationReference: body.confirmationReference || null,
      meetingId,
      confirmationDate: body.confirmationDate
        ? new Date(body.confirmationDate)
        : FieldValue.serverTimestamp(),
      reviewedBy: uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    for (const userId of participants) {
      const ref = adminDb
        .collection("successFeeObligations")
        .doc(successObligationId(matchRef.id, userId));
      tx.create(ref, {
        matchId: matchRef.id,
        userId,
        ...pricing,
        status: "DUE",
        dueAt: new Date(Date.now() + Number(body.dueDays || 7) * 86400000),
        createdAt: FieldValue.serverTimestamp(),
        policySnapshot: { successFee: cfg.successFee },
      });
      tx.set(adminDb.collection("notifications").doc(), {
        userId,
        type: "success_fee_due",
        message:
          "Your independently applicable marriage success fee is now due. Review the accepted undertaking and payment details.",
        status: "unread",
        timestamp: FieldValue.serverTimestamp(),
      });
    }
    audit(tx, uid, "MARRIAGE_CONFIRMED", "marriageMatches", matchRef.id, null, {
      participantIds: participants,
      obligations: 2,
    });
  });
  return NextResponse.json({
    success: true,
    matchId: matchRef.id,
    obligationCount: 2,
  });
}
async function successAction(uid: string, body: any) {
  const allowed = [
    "UNDER_REVIEW",
    "DUE",
    "WAIVED",
    "SETTLED",
    "CLOSED",
    "OUTSTANDING",
  ];
  if (!allowed.includes(body.status))
    throw new ApiError("Invalid obligation action.", 400);
  const ref = adminDb
    .collection("successFeeObligations")
    .doc(body.obligationId);
  await adminDb.runTransaction(async (tx) => {
    const old = await tx.get(ref);
    if (!old.exists) throw new ApiError("Obligation not found.", 404);
    tx.update(ref, {
      status: body.status,
      adminRemarks: body.remarks || null,
      reviewedBy: uid,
      reviewedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    audit(
      tx,
      uid,
      "SUCCESS_FEE_REVIEWED",
      "successFeeObligations",
      ref.id,
      old.data()?.status,
      { status: body.status, remarks: body.remarks || null },
    );
  });
  return NextResponse.json({ success: true });
}
async function saveService(uid: string, service: any) {
  if (!service?.name || !service?.fee)
    throw new ApiError("Service name and fee are required.", 400);
  calculateFee(service.fee);
  const ref = service.id
    ? adminDb.collection("counsellingServices").doc(service.id)
    : adminDb.collection("counsellingServices").doc();
  const { id: _id, ...serviceData } = service;
  await ref.set(
    {
      ...serviceData,
      updatedBy: uid,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: service.createdAt || FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return NextResponse.json({ success: true, id: ref.id });
}
async function setServiceStatus(
  uid: string,
  serviceId: string,
  enabled: boolean,
) {
  if (!serviceId) throw new ApiError("Service ID is required.", 400);
  const ref = adminDb.collection("counsellingServices").doc(serviceId);
  await adminDb.runTransaction(async (tx) => {
    const old = await tx.get(ref);
    if (!old.exists) throw new ApiError("Counselling service not found.", 404);
    if (old.data()?.enabled === enabled) return;
    tx.update(ref, {
      enabled,
      status: enabled ? "ACTIVE" : "INACTIVE",
      statusChangedBy: uid,
      statusChangedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    audit(
      tx,
      uid,
      enabled
        ? "COUNSELLING_SERVICE_ACTIVATED"
        : "COUNSELLING_SERVICE_DEACTIVATED",
      "counsellingServices",
      serviceId,
      { enabled: old.data()?.enabled },
      { enabled },
    );
  });
  return NextResponse.json({ success: true, serviceId, enabled });
}
async function setMatrimonialStatus(uid: string, enabled: boolean) {
  const ref = adminDb.collection("configs").doc(CONSULTANCY_CONFIG_ID),
    history = adminDb.collection("consultancyConfigHistory").doc();
  await adminDb.runTransaction(async (tx) => {
    const old = await tx.get(ref);
    const previous = old.exists
      ? { ...defaultConsultancyConfig, ...old.data() }
      : defaultConsultancyConfig;
    if (previous.matrimonialEnabled === enabled) return;
    const updated = { ...previous, matrimonialEnabled: enabled };
    tx.set(
      ref,
      {
        matrimonialEnabled: enabled,
        updatedBy: uid,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    tx.create(history, {
      previousValue: { matrimonialEnabled: previous.matrimonialEnabled },
      newValue: { matrimonialEnabled: enabled },
      changedBy: uid,
      changedAt: FieldValue.serverTimestamp(),
    });
    audit(
      tx,
      uid,
      enabled
        ? "MATRIMONIAL_SERVICE_ACTIVATED"
        : "MATRIMONIAL_SERVICE_DEACTIVATED",
      "configs",
      CONSULTANCY_CONFIG_ID,
      { matrimonialEnabled: previous.matrimonialEnabled },
      { matrimonialEnabled: enabled },
    );
  });
  return NextResponse.json({ success: true, enabled });
}
async function saveAvailability(uid: string, value: any) {
  if (
    !value?.date ||
    !/\d{4}-\d{2}-\d{2}/.test(value.date) ||
    !Array.isArray(value.slots)
  )
    throw new ApiError("Date and slots are required.", 400);
  await adminDb
    .collection("counsellingAvailability")
    .doc(value.date)
    .set({ ...value, updatedBy: uid, updatedAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ success: true });
}
async function saveDocument(uid: string, document: any) {
  if (!document?.documentId || !document?.type || !document?.title)
    throw new ApiError("Document ID, type and title are required.", 400);
  if (!/^[a-zA-Z0-9_-]{3,80}$/.test(document.documentId))
    throw new ApiError("Document ID contains unsupported characters.", 400);
  if (!String(document.content || "").trim())
    throw new ApiError("Document content is required.", 400);
  const existing = await adminDb
      .collection("consultancyDocumentVersions")
      .where("documentId", "==", document.documentId)
      .get(),
    version =
      Math.max(0, ...existing.docs.map((d) => Number(d.data().version || 0))) +
      1,
    ref = adminDb
      .collection("consultancyDocumentVersions")
      .doc(`${document.documentId}_v${version}`);
  await ref.create({
    ...document,
    version,
    status: "DRAFT",
    legalReviewNotice: "Draft — Legal Review Recommended",
    createdBy: uid,
    modifiedBy: uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ success: true, versionId: ref.id, version });
}
async function publishDocument(uid: string, id: string) {
  const ref = adminDb.collection("consultancyDocumentVersions").doc(id);
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (
      !snap.exists ||
      !["DRAFT", "UNDER_REVIEW", "APPROVED"].includes(snap.data()?.status)
    )
      throw new ApiError("Document version cannot be published.", 409);
    const previousPublished = await tx.get(
      adminDb
        .collection("consultancyDocumentVersions")
        .where("documentId", "==", snap.data()!.documentId)
        .where("status", "==", "PUBLISHED"),
    );
    for (const previous of previousPublished.docs) {
      if (previous.id !== id)
        tx.update(previous.ref, {
          status: "ARCHIVED",
          effectiveUntil: FieldValue.serverTimestamp(),
          archivedBy: uid,
          updatedAt: FieldValue.serverTimestamp(),
        });
    }
    tx.update(ref, {
      status: "PUBLISHED",
      approvedBy: uid,
      publishedBy: uid,
      effectiveFrom: snap.data()?.effectiveFrom || FieldValue.serverTimestamp(),
      publishedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    audit(
      tx,
      uid,
      "LEGAL_DOCUMENT_PUBLISHED",
      "consultancyDocumentVersions",
      id,
      snap.data()?.status,
      { version: snap.data()?.version, type: snap.data()?.type },
    );
  });
  return NextResponse.json({ success: true });
}
async function complaintDecision(uid: string, body: any) {
  if (
    ![
      "UNDER_REVIEW",
      "ADDITIONAL_INFORMATION_REQUIRED",
      "RESPONSE_REQUESTED",
      "DECISION",
      "CLOSED",
    ].includes(body.status)
  )
    throw new ApiError("Invalid complaint status.", 400);
  const ref = adminDb.collection("consultancyComplaints").doc(body.complaintId);
  await adminDb.runTransaction(async (tx) => {
    const old = await tx.get(ref);
    if (!old.exists) throw new ApiError("Complaint not found.", 404);
    tx.update(ref, {
      status: body.status,
      decision: body.decision || null,
      action: body.reviewAction || "NO_ACTION",
      guiltDetermined:
        body.status === "DECISION"
          ? Boolean(body.guiltDetermined)
          : old.data()?.guiltDetermined || false,
      responseOpportunityProvided: Boolean(body.responseOpportunityProvided),
      reviewedBy: uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
    audit(
      tx,
      uid,
      "COMPLAINT_REVIEWED",
      "consultancyComplaints",
      ref.id,
      old.data()?.status,
      { status: body.status, action: body.reviewAction || "NO_ACTION" },
    );
  });
  return NextResponse.json({ success: true });
}

async function saveMatrimonialCommissionPolicy(uid: string, input: any) {
  const all = await adminDb
      .collection("ibaMatrimonialCommissionPolicies")
      .get(),
    version =
      Math.max(0, ...all.docs.map((doc) => Number(doc.data().version || 0))) +
      1,
    policy: MatrimonialCommissionPolicy = {
      ...defaultMatrimonialCommissionPolicy,
      ...input,
      profileMeeting: {
        ...defaultMatrimonialCommissionPolicy.profileMeeting,
        ...(input?.profileMeeting || {}),
      },
      marriageFixed: {
        ...defaultMatrimonialCommissionPolicy.marriageFixed,
        ...(input?.marriageFixed || {}),
      },
      version,
      status: "DRAFT",
      active: false,
    },
    errors = validateMatrimonialCommissionPolicy(policy);
  if (errors.length) throw new ApiError(errors.join(" "), 400);
  const ref = adminDb
    .collection("ibaMatrimonialCommissionPolicies")
    .doc(`matrimonial_commission_v${version}`);
  await ref.create({
    ...policy,
    createdBy: uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ success: true, policyId: ref.id, version });
}

async function publishMatrimonialCommissionPolicy(uid: string, id: string) {
  const ref = adminDb.collection("ibaMatrimonialCommissionPolicies").doc(id);
  await adminDb.runTransaction(async (tx) => {
    const [draft, published] = await Promise.all([
      tx.get(ref),
      tx.get(
        adminDb
          .collection("ibaMatrimonialCommissionPolicies")
          .where("status", "==", "PUBLISHED"),
      ),
    ]);
    if (!draft.exists || draft.data()?.status !== "DRAFT")
      throw new ApiError("Only a draft policy can be published.", 409);
    const errors = validateMatrimonialCommissionPolicy(
      draft.data() as MatrimonialCommissionPolicy,
    );
    if (errors.length) throw new ApiError(errors.join(" "), 400);
    for (const previous of published.docs)
      tx.update(previous.ref, {
        status: "ARCHIVED",
        active: false,
        archivedBy: uid,
        archivedAt: FieldValue.serverTimestamp(),
      });
    tx.update(ref, {
      status: "PUBLISHED",
      active: true,
      publishedBy: uid,
      publishedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    audit(
      tx,
      uid,
      "MATRIMONIAL_COMMISSION_POLICY_PUBLISHED",
      "ibaMatrimonialCommissionPolicies",
      id,
      null,
      { version: draft.data()?.version },
    );
  });
  return NextResponse.json({ success: true });
}

async function overrideMatrimonialReferral(uid: string, body: any) {
  const customerId = String(body.customerId || ""),
    reason = String(body.reason || "").trim(),
    code = String(body.referralCode || "")
      .trim()
      .toUpperCase();
  if (!customerId || reason.length < 10)
    throw new ApiError(
      "Customer and a detailed correction reason are required.",
      400,
    );
  const wallets = code
    ? await adminDb
        .collection("wallets")
        .where("referralCode", "==", code)
        .limit(1)
        .get()
    : null;
  if (code && wallets?.empty) throw new ApiError("IBA ID was not found.", 404);
  const ibaUid = code ? wallets!.docs[0].id : null;
  if (ibaUid) {
    const [ibaUser, eligibility] = await Promise.all([
      adminDb.collection("users").doc(ibaUid).get(),
      adminDb.collection("ibaEligibility").doc(ibaUid).get(),
    ]);
    if (
      ibaUser.data()?.purchasedMockTest !== true ||
      ["SUSPENDED", "INACTIVE"].includes(ibaUser.data()?.accountStatus) ||
      eligibility.data()?.status === "SUSPENDED"
    )
      throw new ApiError("The selected IBA is not active and eligible.", 409);
  }
  const ref = adminDb.collection("ibaMatrimonialReferrals").doc(customerId),
    commissions = await adminDb
      .collection("ibaMatrimonialCommissions")
      .where("customerId", "==", customerId)
      .limit(1)
      .get();
  if (!commissions.empty)
    throw new ApiError(
      "Attribution cannot be reassigned after commission qualification. Resolve existing commissions through the audited adjustment workflow.",
      409,
    );
  await adminDb.runTransaction(async (tx) => {
    const old = await tx.get(ref);
    if (!old.exists) throw new ApiError("Referral attribution not found.", 404);
    tx.update(ref, {
      ibaUid,
      referralCode: code || null,
      referralSource: code ? "ADMIN_CORRECTION" : "DIRECT",
      adminOverride: {
        changedBy: uid,
        reason,
        changedAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    });
    audit(
      tx,
      uid,
      "MATRIMONIAL_REFERRAL_OVERRIDDEN",
      "ibaMatrimonialReferrals",
      customerId,
      old.data(),
      { ibaUid, referralCode: code || null, reason },
    );
  });
  return NextResponse.json({ success: true });
}

async function matrimonialCommissionAction(uid: string, body: any) {
  const status = String(body.status || ""),
    reason = String(body.reason || "").trim();
  if (
    !["APPROVED", "ON_HOLD", "REVERSED", "DISPUTED", "CANCELLED"].includes(
      status,
    )
  )
    throw new ApiError("Invalid commission action.", 400);
  if (
    ["ON_HOLD", "REVERSED", "CANCELLED"].includes(status) &&
    reason.length < 5
  )
    throw new ApiError("A reason is required for this action.", 400);
  const ref = adminDb
    .collection("ibaMatrimonialCommissions")
    .doc(String(body.commissionId || ""));
  await adminDb.runTransaction(async (tx) => {
    const old = await tx.get(ref);
    if (!old.exists) throw new ApiError("Commission not found.", 404);
    const previousStatus = old.data()?.status;
    if (previousStatus === "PAID" && status !== "REVERSED")
      throw new ApiError("Paid commission is immutable.", 409);
    if (status === "APPROVED" && previousStatus !== "ELIGIBLE")
      throw new ApiError("Only an eligible commission can be approved.", 409);
    tx.update(ref, {
      status,
      actionReason: reason || null,
      approvedAt:
        status === "APPROVED"
          ? FieldValue.serverTimestamp()
          : old.data()?.approvedAt || null,
      reversedAt: status === "REVERSED" ? FieldValue.serverTimestamp() : null,
      reviewedBy: uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
    if (previousStatus === "PAID" && status === "REVERSED")
      tx.create(adminDb.collection("ibaPayoutHistory").doc(), {
        ibaUid: old.data()?.ibaUid,
        payoutId: old.data()?.payoutReference || null,
        matrimonialCommissionId: ref.id,
        recordType: "ADJUSTMENT_REQUIRED",
        adjustmentAmount: -Number(old.data()?.commissionAmount || 0),
        reason,
        status: "PENDING_REVIEW",
        changedBy: uid,
        changedAt: FieldValue.serverTimestamp(),
      });
    audit(
      tx,
      uid,
      "IBA_MATRIMONIAL_COMMISSION_STATUS_CHANGED",
      "ibaMatrimonialCommissions",
      ref.id,
      previousStatus,
      { status, reason },
    );
    tx.create(adminDb.collection("notifications").doc(), {
      userId: old.data()?.ibaUid,
      type: `matrimonial_commission_${status.toLowerCase()}`,
      message: `A matrimonial referral commission is now ${status.replaceAll("_", " ").toLowerCase()}.`,
      status: "unread",
      timestamp: FieldValue.serverTimestamp(),
    });
  });
  return NextResponse.json({ success: true });
}

async function refundMatrimonialPayment(uid: string, body: any) {
  const commissionRef = adminDb
      .collection("ibaMatrimonialCommissions")
      .doc(String(body.commissionId || "")),
    initial = await commissionRef.get(),
    reason = String(body.reason || "").trim();
  if (!initial.exists) throw new ApiError("Commission not found.", 404);
  if (reason.length < 10)
    throw new ApiError("A detailed refund reason is required.", 400);
  const initialData = initial.data()!,
    paymentRef = adminDb
      .collection("transactions")
      .doc(initialData.qualifyingPaymentTransactionId),
    walletRef = adminDb.collection("wallets").doc(initialData.customerId),
    refundRef = adminDb.collection("transactions").doc(),
    meetingPayments =
      initialData.sourceType === "MATRIMONIAL_PROFILE_MEETING"
        ? await adminDb
            .collection("meetingParticipantPayments")
            .where(
              "transactionId",
              "==",
              initialData.qualifyingPaymentTransactionId,
            )
            .limit(1)
            .get()
        : null,
    meetingPaymentRef = meetingPayments?.docs[0]?.ref || null,
    meetingRef = initialData.meetingId
      ? adminDb.collection("matrimonialMeetings").doc(initialData.meetingId)
      : null,
    obligationRef = initialData.matchId
      ? adminDb
          .collection("successFeeObligations")
          .doc(successObligationId(initialData.matchId, initialData.customerId))
      : null;
  await adminDb.runTransaction(async (tx) => {
    const [commission, payment, wallet, meeting, meetingPayment, obligation] =
      await Promise.all([
        tx.get(commissionRef),
        tx.get(paymentRef),
        tx.get(walletRef),
        meetingRef ? tx.get(meetingRef) : Promise.resolve(null),
        meetingPaymentRef ? tx.get(meetingPaymentRef) : Promise.resolve(null),
        obligationRef ? tx.get(obligationRef) : Promise.resolve(null),
      ]);
    if (
      commission.data()?.status === "REVERSED" ||
      payment.data()?.status === "Refunded"
    )
      return;
    if (!payment.exists || payment.data()?.status !== "Completed")
      throw new ApiError("The qualifying payment is not refundable.", 409);
    const amount = Math.abs(Number(payment.data()?.amount || 0));
    if (!amount) throw new ApiError("Refund amount is invalid.", 409);
    tx.set(
      walletRef,
      { balance: Number(wallet.data()?.balance || 0) + amount },
      { merge: true },
    );
    tx.update(paymentRef, {
      status: "Refunded",
      refundTransactionId: refundRef.id,
      refundedAt: FieldValue.serverTimestamp(),
      refundReason: reason,
    });
    tx.create(refundRef, {
      user: initialData.customerId,
      amount,
      type: "refund",
      status: "Completed",
      description: `Refund: ${payment.data()?.description || "Matrimonial payment"}`,
      originalTransactionId: paymentRef.id,
      reason,
      date: FieldValue.serverTimestamp(),
    });
    if (meetingPayment?.exists)
      tx.update(meetingPayment.ref, {
        status: "REFUNDED",
        refundTransactionId: refundRef.id,
        refundedAt: FieldValue.serverTimestamp(),
      });
    if (meeting?.exists) {
      const payments = {
        ...(meeting.data()?.participantPayments || {}),
        [initialData.customerId]: false,
      };
      tx.update(meeting.ref, {
        participantPayments: payments,
        status: "PAYMENT_REFUND_REVIEW",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    if (obligation?.exists)
      tx.update(obligation.ref, {
        status: "OUTSTANDING",
        paidAmount: 0,
        refundTransactionId: refundRef.id,
        updatedAt: FieldValue.serverTimestamp(),
      });
    tx.update(commissionRef, {
      status: "REVERSED",
      reversalReason: reason,
      reversedAt: FieldValue.serverTimestamp(),
      refundTransactionId: refundRef.id,
      updatedAt: FieldValue.serverTimestamp(),
    });
    if (commission.data()?.status === "PAID")
      tx.create(adminDb.collection("ibaPayoutHistory").doc(), {
        ibaUid: commission.data()?.ibaUid,
        payoutId: commission.data()?.payoutReference || null,
        matrimonialCommissionId: commissionRef.id,
        recordType: "ADJUSTMENT_REQUIRED",
        adjustmentAmount: -Number(commission.data()?.commissionAmount || 0),
        reason,
        status: "PENDING_REVIEW",
        changedBy: uid,
        changedAt: FieldValue.serverTimestamp(),
      });
    audit(
      tx,
      uid,
      "MATRIMONIAL_PAYMENT_REFUNDED",
      "transactions",
      paymentRef.id,
      { status: payment.data()?.status, amount: payment.data()?.amount },
      { status: "Refunded", refundTransactionId: refundRef.id, reason },
    );
    tx.create(adminDb.collection("notifications").doc(), {
      userId: initialData.customerId,
      type: "matrimonial_payment_refunded",
      message:
        "A matrimonial payment was refunded to your Vidya Educare wallet.",
      status: "unread",
      timestamp: FieldValue.serverTimestamp(),
    });
    tx.create(adminDb.collection("notifications").doc(), {
      userId: commission.data()?.ibaUid,
      type: "matrimonial_commission_reversed",
      message:
        "A matrimonial referral commission was reversed because its qualifying payment was refunded.",
      status: "unread",
      timestamp: FieldValue.serverTimestamp(),
    });
  });
  return NextResponse.json({
    success: true,
    refundTransactionId: refundRef.id,
  });
}

async function aiDraft(body: any) {
  if (!process.env.GEMINI_API_KEY)
    throw new ApiError("AI drafting is not configured.", 503);
  const prompt = `Create an editable legal/policy draft for Admin review. Do not claim guaranteed validity or compliance. Do not invent statutes or section numbers. Label it 'Draft — Legal Review Recommended'.\nJurisdiction: ${String(body.jurisdiction || "India")}\nDocument: ${String(body.documentType || "")}\nService: ${String(body.serviceType || "")}\nBusiness and fee terms: ${String(body.instructions || "").slice(0, 8000)}`;
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  );
  if (!r.ok) throw new ApiError("AI draft generation failed.", 502);
  const data = await r.json();
  return NextResponse.json({
    draft: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
    status: "DRAFT",
    notice: "Draft — Legal Review Recommended",
  });
}
async function loadConfig() {
  const snap = await adminDb
    .collection("configs")
    .doc(CONSULTANCY_CONFIG_ID)
    .get();
  return snap.exists
    ? ({ ...defaultConsultancyConfig, ...snap.data() } as ConsultancyConfig)
    : defaultConsultancyConfig;
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
function docs(s: FirebaseFirestore.QuerySnapshot) {
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
}
function metrics(
  p: FirebaseFirestore.QuerySnapshot,
  v: FirebaseFirestore.QuerySnapshot,
  m: FirebaseFirestore.QuerySnapshot,
  mm: FirebaseFirestore.QuerySnapshot,
  o: FirebaseFirestore.QuerySnapshot,
  s: FirebaseFirestore.QuerySnapshot,
  b: FirebaseFirestore.QuerySnapshot,
  c: FirebaseFirestore.QuerySnapshot,
) {
  const count = (x: FirebaseFirestore.QuerySnapshot, status: string) =>
    x.docs.filter((d) => d.data().status === status).length;
  return {
    registrations: p.size,
    activeProfiles: count(p, "ACTIVE"),
    verificationPending: v.size - count(v, "VERIFIED") - count(v, "REJECTED"),
    verifiedProfiles: count(v, "VERIFIED"),
    meetings: m.size,
    upcomingMeetings: count(m, "CONFIRMED"),
    completedMeetings: count(m, "COMPLETED"),
    marriageMatches: mm.size,
    successFeesDue: count(o, "DUE"),
    successFeesPaid: count(o, "PAID"),
    disputes: count(o, "DISPUTED"),
    counsellingServices: s.size,
    bookings: b.size,
    upcomingSessions: count(b, "CONFIRMED"),
    complaints: c.size,
  };
}
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
function fail(error: unknown) {
  const status =
    error instanceof RequestAuthError || error instanceof ApiError
      ? error.status
      : 500;
  console.error("Admin consultancy API failed", error);
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Admin request failed." },
    { status },
  );
}
