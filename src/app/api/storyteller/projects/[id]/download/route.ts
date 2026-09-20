import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/firebase/admin-init";
import { RequestAuthError, verifyRequester } from "@/lib/server-auth";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyRequester(request);
    const snap = await adminDb.collection("storytellerProjects").doc(params.id).get();
    const data = snap.data();
    if (!snap.exists || data?.userId !== user.uid) return NextResponse.json({ error: "Reel not found." }, { status: 404 });
    if (data?.paymentStatus !== "PAID" || data?.generationStatus !== "READY" || !data?.finalAssetPath) return NextResponse.json({ error: "Reel is not ready for download." }, { status: 409 });
    const [url] = await adminStorage.bucket().file(data.finalAssetPath).getSignedUrl({ action: "read", expires: Date.now() + 5 * 60 * 1000 });
    return NextResponse.json({ url, expiresInSeconds: 300 });
  } catch (error) {
    const status = error instanceof RequestAuthError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Download failed." }, { status });
  }
}
