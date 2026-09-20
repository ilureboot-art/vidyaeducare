import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/admin-init";
import { RequestAuthError, verifyRequester } from "@/lib/server-auth";
import { dispatchStorytellerRenderer } from "@/lib/storyteller-renderer";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyRequester(request);
    const projectRef = adminDb.collection("storytellerProjects").doc(params.id);
    const jobRef = adminDb.collection("storytellerJobs").doc(params.id);
    await adminDb.runTransaction(async tx => {
      const [project, job] = await Promise.all([tx.get(projectRef), tx.get(jobRef)]);
      if (!project.exists || project.data()?.userId !== user.uid) throw new RetryError("Reel not found.", 404);
      if (project.data()?.paymentStatus !== "PAID" || !["FAILED", "DISPATCH_FAILED"].includes(project.data()?.generationStatus)) throw new RetryError("This reel is not eligible for a free retry.", 409);
      if (!job.exists) throw new RetryError("Generation job not found.", 404);
      tx.update(projectRef, { generationStatus: "QUEUED", updatedAt: FieldValue.serverTimestamp() });
      tx.update(jobRef, { status: "QUEUED", manualRetryRequested: true, updatedAt: FieldValue.serverTimestamp() });
    });
    try { await dispatchStorytellerRenderer(params.id); }
    catch (error) {
      await projectRef.set({ generationStatus: "DISPATCH_FAILED", lastError: error instanceof Error ? error.message : "Dispatch failed", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      await jobRef.set({ status: "DISPATCH_FAILED", lastError: error instanceof Error ? error.message : "Dispatch failed", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      throw error;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = error instanceof RequestAuthError || error instanceof RetryError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Retry failed." }, { status });
  }
}
class RetryError extends Error { constructor(message: string, public status: number) { super(message); } }
