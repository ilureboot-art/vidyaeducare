import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/admin-init";
import { verifyRequester, RequestAuthError } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  try {
    await verifyRequester(request);
    const now = new Date().toISOString();
    const snapshot = await adminDb.collection("ibaRemunerationPolicies")
      .where("active", "==", true)
      .where("status", "==", "PUBLISHED")
      .get();
    const policyDoc = snapshot.docs
      .filter((doc) => String(doc.data().effectiveFrom || "") <= now)
      .sort((a, b) => Number(b.data().version || 0) - Number(a.data().version || 0))[0];
    if (!policyDoc) return NextResponse.json({ policy: null });
    const data = policyDoc.data();
    return NextResponse.json({ policy: { ...data, id: policyDoc.id, createdAt: iso(data.createdAt), updatedAt: iso(data.updatedAt), publishedAt: iso(data.publishedAt) } });
  } catch (error) {
    const status = error instanceof RequestAuthError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load policy." }, { status });
  }
}

function iso(value: unknown) {
  return value instanceof Timestamp ? value.toDate().toISOString() : value ?? null;
}
