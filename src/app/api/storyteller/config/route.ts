import { NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin-init";
import { defaultStorytellerConfig, publicStorytellerConfig, STORYTELLER_CONFIG_ID, StorytellerConfig } from "@/lib/storyteller";

export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await adminDb.collection("configs").doc(STORYTELLER_CONFIG_ID).get();
  const config = snap.exists ? { ...defaultStorytellerConfig, ...snap.data() } as StorytellerConfig : defaultStorytellerConfig;
  const safe = publicStorytellerConfig(config);
  if (safe.demoAssetPath.startsWith("storyteller/demo/")) safe.demoAssetPath = "/api/storyteller/demo";
  return NextResponse.json({ config: safe });
}
