import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { Readable } from "node:stream";
import { adminDb, adminStorage } from "@/firebase/admin-init";
import { STORYTELLER_CONFIG_ID } from "@/lib/storyteller";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const config = await adminDb.collection("configs").doc(STORYTELLER_CONFIG_ID).get();
  const path = String(config.data()?.demoAssetPath || "");
  if (!config.data()?.demoEnabled || !path.startsWith("storyteller/demo/")) return NextResponse.json({ error: "Demo unavailable." }, { status: 404 });
  const file = adminStorage.bucket().file(path);
  const [metadata] = await file.getMetadata();
  const size = Number(metadata.size);
  if (!Number.isSafeInteger(size) || size <= 0) return NextResponse.json({ error: "Demo unavailable." }, { status: 404 });
  const range = request.headers.get("range");
  let start = 0;
  let end = size - 1;
  if (range) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (!match) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    start = Number(match[1]);
    end = match[2] ? Math.min(Number(match[2]), size - 1) : Math.min(start + 1024 * 1024 - 1, size - 1);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size)
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }
  await adminDb.collection("storytellerAnalytics").doc("totals").set({ demoViews: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return new Response(Readable.toWeb(file.createReadStream({ start, end })) as ReadableStream, {
    status: range ? 206 : 200,
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
      ...(range ? { "Content-Range": `bytes ${start}-${end}/${size}` } : {}),
    },
  });
}
