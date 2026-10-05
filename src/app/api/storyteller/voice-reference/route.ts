import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminStorage } from "@/firebase/admin-init";
import { RequestAuthError, verifyRequester } from "@/lib/server-auth";
import { defaultStorytellerConfig, STORYTELLER_CONFIG_ID, StorytellerConfig } from "@/lib/storyteller";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequester(request);
    const account = await adminDb.collection("storytellerAccounts").doc(user.uid).get();
    if (account.data()?.status !== "ACTIVE" || account.data()?.adultVerified !== true) return NextResponse.json({error:"Verified adult StoryTeller account required."},{status:403});
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Voice reference file is required." }, { status: 400 });
    const configSnap = await adminDb.collection("configs").doc(STORYTELLER_CONFIG_ID).get();
    const config = configSnap.exists ? { ...defaultStorytellerConfig, ...configSnap.data() } as StorytellerConfig : defaultStorytellerConfig;
    if (!config.ownVoiceEnabled) return NextResponse.json({error:"Own voice is disabled."},{status:503});
    if (!config.allowedVoiceMimeTypes.includes(file.type)) return NextResponse.json({ error: "Only MP3, WAV and M4A voice references are accepted." }, { status: 415 });
    if (file.size <= 0 || file.size > config.maxVoiceUploadMb * 1024 * 1024) return NextResponse.json({ error: `Voice reference must be smaller than ${config.maxVoiceUploadMb} MB.` }, { status: 413 });

    const reference = adminDb.collection("storytellerVoiceReferences").doc();
    const extension = file.type.includes("wav") ? "wav" : file.type.includes("mp4") || file.type.includes("m4a") ? "m4a" : "mp3";
    const assetPath = `storyteller/users/${user.uid}/voice-references/${reference.id}.${extension}`;
    await adminStorage.bucket().file(assetPath).save(Buffer.from(await file.arrayBuffer()), {
      resumable: false,
      metadata: { contentType: file.type, cacheControl: "private,max-age=0,no-store" },
    });
    await reference.create({ userId: user.uid, assetPath, contentType: file.type, size: file.size, status: "UPLOADED", createdAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ voiceReferenceId: reference.id });
  } catch (error) {
    const status = error instanceof RequestAuthError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Voice reference upload failed." }, { status });
  }
}

