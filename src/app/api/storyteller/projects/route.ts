import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin-init";
import { RequestAuthError, verifyRequester } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRequester(request);
    const snapshot = await adminDb.collection("storytellerProjects").where("userId", "==", user.uid).get();
    const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => toMillis(b.createdAt) - toMillis(a.createdAt));
    return NextResponse.json({ projects });
  } catch (error) {
    const status = error instanceof RequestAuthError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load reels." }, { status });
  }
}

function toMillis(value: any) { return value?.toMillis?.() ?? (value ? new Date(value).getTime() : 0); }
