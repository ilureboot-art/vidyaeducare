import { NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin-init";
import { defaultStorytellerConfig, publicStorytellerConfig, SANJAY_CUSTOM_VOICE_ID, STORYTELLER_CONFIG_ID, StorytellerConfig } from "@/lib/storyteller";

export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await adminDb.collection("configs").doc(STORYTELLER_CONFIG_ID).get();
  const config = snap.exists ? { ...defaultStorytellerConfig, ...snap.data() } as StorytellerConfig : defaultStorytellerConfig;
  const safe = publicStorytellerConfig(config);
  if (process.env.STORYTELLER_CUSTOM_VOICE_READY !== "true") safe.voices = safe.voices.filter(voice => voice.id !== SANJAY_CUSTOM_VOICE_ID);
  if (safe.demoAssetPath.startsWith("storyteller/demo/")) safe.demoAssetPath = "/api/storyteller/demo";
  return NextResponse.json({ config: safe });
}
