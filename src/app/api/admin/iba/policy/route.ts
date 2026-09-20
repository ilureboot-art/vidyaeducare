import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/admin-init";
import { IbaRemunerationPolicy, defaultIbaRemunerationPolicy, validateIbaPolicy } from "@/lib/iba-remuneration";
import { RequestAuthError, verifyRequester } from "@/lib/server-auth";

const policies = adminDb.collection("ibaRemunerationPolicies");

export async function GET(request: NextRequest) {
  try {
    await verifyRequester(request, true);
    const [policySnapshot, historySnapshot] = await Promise.all([
      policies.orderBy("version", "desc").get(),
      adminDb.collection("ibaPolicyHistory").orderBy("changedAt", "desc").limit(100).get(),
    ]);
    return NextResponse.json({
      policies: policySnapshot.docs.map((doc) => serialize({ id: doc.id, ...doc.data() })),
      history: historySnapshot.docs.map((doc) => serialize({ id: doc.id, ...doc.data() })),
      defaultPolicy: defaultIbaRemunerationPolicy,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyRequester(request, true);
    const body = await request.json();
    const action = body.action as "SAVE" | "PUBLISH" | "DEACTIVATE";
    if (!action || !["SAVE", "PUBLISH", "DEACTIVATE"].includes(action)) return NextResponse.json({ error: "Invalid policy action." }, { status: 400 });
    const incoming = body.policy as IbaRemunerationPolicy;
    if (!incoming || typeof incoming !== "object") return NextResponse.json({ error: "Policy details are required." }, { status: 400 });

    const latestSnapshot = await policies.orderBy("version", "desc").limit(1).get();
    const latest = latestSnapshot.empty ? null : { id: latestSnapshot.docs[0].id, ...latestSnapshot.docs[0].data() } as IbaRemunerationPolicy;
    const editingDraft = action === "SAVE" && incoming.status === "DRAFT" && Boolean(incoming.id);
    const nextVersion = action === "PUBLISH" || (action === "SAVE" && !editingDraft)
      ? (latest?.version ?? 0) + 1
      : (incoming.version || latest?.version || 1);
    const policy: IbaRemunerationPolicy = {
      ...defaultIbaRemunerationPolicy,
      ...incoming,
      version: nextVersion,
      status: action === "PUBLISH" ? "PUBLISHED" : action === "DEACTIVATE" ? "INACTIVE" : "DRAFT",
      active: action === "PUBLISH",
    };
    const errors = validateIbaPolicy(policy);
    if (errors.length) return NextResponse.json({ error: "Policy validation failed.", details: errors }, { status: 400 });

    const targetRef = editingDraft || action === "DEACTIVATE" ? policies.doc(incoming.id!) : policies.doc();
    const previousSnapshot = editingDraft || action === "DEACTIVATE" ? await targetRef.get() : null;
    const previousValue = previousSnapshot?.exists ? previousSnapshot.data() : latest;
    const batch = adminDb.batch();

    if (action === "PUBLISH") {
      const activeSnapshot = await policies.where("active", "==", true).get();
      activeSnapshot.docs.forEach((doc) => batch.update(doc.ref, { active: false, status: "INACTIVE", updatedAt: FieldValue.serverTimestamp(), updatedBy: admin.uid }));
    }
    if (action === "DEACTIVATE" && incoming.id) {
      batch.set(targetRef, { ...policy, updatedAt: FieldValue.serverTimestamp(), updatedBy: admin.uid }, { merge: true });
    } else {
      batch.set(targetRef, {
        ...policy,
        id: FieldValue.delete(),
        createdAt: previousSnapshot?.exists ? previousSnapshot.data()?.createdAt ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
        createdBy: previousSnapshot?.exists ? previousSnapshot.data()?.createdBy ?? admin.uid : admin.uid,
        updatedAt: FieldValue.serverTimestamp(), updatedBy: admin.uid,
        ...(action === "PUBLISH" ? { publishedAt: FieldValue.serverTimestamp(), publishedBy: admin.uid } : {}),
      }, { merge: true });
    }
    const historyRef = adminDb.collection("ibaPolicyHistory").doc();
    batch.set(historyRef, {
      policyId: targetRef.id,
      policyVersion: nextVersion,
      action,
      previousValue: previousValue ?? null,
      newValue: policy,
      changedBy: admin.uid,
      changedAt: FieldValue.serverTimestamp(),
      effectiveFrom: policy.effectiveFrom ? Timestamp.fromDate(new Date(policy.effectiveFrom)) : null,
    });
    await batch.commit();
    return NextResponse.json({ success: true, id: targetRef.id, version: nextVersion, status: policy.status });
  } catch (error) {
    return apiError(error);
  }
}

function serialize(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serialize(item)]));
  return value;
}

function apiError(error: unknown) {
  const status = error instanceof RequestAuthError ? error.status : 500;
  console.error("IBA policy API failed:", error);
  return NextResponse.json({ error: error instanceof Error ? error.message : "Policy operation failed." }, { status });
}
