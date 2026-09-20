import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminStorage } from "@/firebase/admin-init";
import { STORYTELLER_CONFIG_ID } from "@/lib/storyteller";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await adminDb.collection("configs").doc(STORYTELLER_CONFIG_ID).get();
  const path = String(config.data()?.demoAssetPath || "");
  if (!config.data()?.demoEnabled || !path.startsWith("storyteller/demo/")) return NextResponse.json({ error: "Demo unavailable." }, { status: 404 });
  const [url] = await adminStorage.bucket().file(path).getSignedUrl({ action: "read", expires: Date.now() + 15 * 60 * 1000 });
  await adminDb.collection("storytellerAnalytics").doc("totals").set({ demoViews: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return NextResponse.redirect(url);
}
