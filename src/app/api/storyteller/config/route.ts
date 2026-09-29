import { NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin-init";
import { defaultStorytellerConfig, publicStorytellerConfig, SANJAY_CUSTOM_VOICE_ID, STORYTELLER_CONFIG_ID, StorytellerConfig } from "@/lib/storyteller";

export const dynamic = "force-dynamic";

const FIXED_DEMO = {
  demoEnabled: true,
  demoAssetPath: "/api/storyteller/fixed-demo",
  demoTitle: "बेड खाली कोण आहे? – Cinematic Audio Demo",
  demoDescription: "हा fixed StoryTeller AI cinematic audio demo ऐका; त्यानंतर तुमची स्वतःची paid story-to-audio reel तयार करा.",
};

export async function GET() {
  const snap = await adminDb.collection("configs").doc(STORYTELLER_CONFIG_ID).get();
  const config = snap.exists ? { ...defaultStorytellerConfig, ...snap.data() } as StorytellerConfig : defaultStorytellerConfig;
  const safe = { ...publicStorytellerConfig(config), ...FIXED_DEMO };
  if (process.env.STORYTELLER_CUSTOM_VOICE_READY !== "true") safe.voices = safe.voices.filter(voice => voice.id !== SANJAY_CUSTOM_VOICE_ID);
  if (safe.demoAssetPath.startsWith("storyteller/demo/")) safe.demoAssetPath = "/api/storyteller/demo";
  return NextResponse.json({ config: safe });
}
