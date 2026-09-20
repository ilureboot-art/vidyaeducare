import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/admin-init";
import { RequestAuthError, verifyRequester } from "@/lib/server-auth";
import { defaultStorytellerConfig, STORYTELLER_CONFIG_ID, StorytellerConfig, validateStorytellerConfig } from "@/lib/storyteller";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await verifyRequester(request, true);
    const snap = await adminDb.collection("configs").doc(STORYTELLER_CONFIG_ID).get();
    return NextResponse.json({ config: snap.exists ? { ...defaultStorytellerConfig, ...snap.data() } : defaultStorytellerConfig });
  } catch (error) { return failure(error); }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyRequester(request, true);
    const input = await request.json() as StorytellerConfig;
    const config = { ...defaultStorytellerConfig, ...input, loginRequired: true, currency: "INR" } as StorytellerConfig;
    const errors = validateStorytellerConfig(config);
    if (errors.length) return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    const ref = adminDb.collection("configs").doc(STORYTELLER_CONFIG_ID);
    const history = adminDb.collection("storytellerConfigHistory").doc();
    await adminDb.runTransaction(async tx => {
      const previous = await tx.get(ref);
      tx.set(history, { previousValue: previous.exists ? previous.data() : null, newValue: config, changedBy: admin.uid, changedAt: FieldValue.serverTimestamp() });
      tx.set(ref, { ...config, updatedBy: admin.uid, updatedAt: FieldValue.serverTimestamp() });
    });
    return NextResponse.json({ success: true, config });
  } catch (error) { return failure(error); }
}

function failure(error: unknown) {
  const status = error instanceof RequestAuthError ? error.status : 500;
  return NextResponse.json({ error: error instanceof Error ? error.message : "StoryTeller configuration failed." }, { status });
}
