import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminStorage } from "@/firebase/admin-init";
import { RequestAuthError, verifyRequester } from "@/lib/server-auth";
import { STORYTELLER_CONFIG_ID } from "@/lib/storyteller";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyRequester(request, true);
    const form = await request.formData(); const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Demo audio is required." }, { status: 400 });
    if (!["audio/mpeg", "audio/mp4", "audio/x-m4a"].includes(file.type)) return NextResponse.json({ error: "Only MP3 and M4A demo files are supported." }, { status: 400 });
    if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "Demo file must be 20 MB or smaller." }, { status: 400 });
    const extension = file.type === "audio/mpeg" ? "mp3" : "m4a";
    const assetPath = `storyteller/demo/demo-${Date.now()}.${extension}`;
    await adminStorage.bucket().file(assetPath).save(Buffer.from(await file.arrayBuffer()), { resumable: false, contentType: file.type, metadata: { cacheControl: "public,max-age=3600" } });
    await adminDb.collection("configs").doc(STORYTELLER_CONFIG_ID).set({ demoAssetPath: assetPath, demoEnabled: true, updatedBy: admin.uid, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ success: true, demoAssetPath: assetPath });
  } catch (error) { const status=error instanceof RequestAuthError?error.status:500; return NextResponse.json({error:error instanceof Error?error.message:"Upload failed."},{status}); }
}
