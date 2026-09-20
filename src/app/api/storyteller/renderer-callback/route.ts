import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/admin-init";
import { dispatchStorytellerRenderer } from "@/lib/storyteller-renderer";

export async function POST(request: NextRequest) {
  if (!process.env.STORYTELLER_RENDERER_SECRET || request.headers.get("x-storyteller-secret") !== process.env.STORYTELLER_RENDERER_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { projectId: string; status: "GENERATING" | "READY" | "FAILED"; finalAssetPath?: string; error?: string; estimatedVoiceCost?: number; estimatedRenderingCost?: number };
  if (!body.projectId || !["GENERATING", "READY", "FAILED"].includes(body.status)) return NextResponse.json({ error: "Invalid callback." }, { status: 400 });
  const projectRef = adminDb.collection("storytellerProjects").doc(body.projectId);
  const jobRef = adminDb.collection("storytellerJobs").doc(body.projectId);
  const analyticsRef = adminDb.collection("storytellerAnalytics").doc("totals");
  let retry = false;
  await adminDb.runTransaction(async tx => {
    const project = await tx.get(projectRef);
    if (!project.exists || project.data()?.paymentStatus !== "PAID") throw new Error("Paid project not found.");
    if (project.data()?.generationStatus === "REFUNDED") throw new Error("Refunded projects cannot be rendered.");
    const job = await tx.get(jobRef);
    const attemptCount = Number(job.data()?.attemptCount || 0) + (body.status === "FAILED" ? 1 : 0);
    const maxRetries = Number(job.data()?.maxRetries || 0);
    const failurePolicy = String(job.data()?.failurePolicy || "RETRY_THEN_REFUND");
    if (body.status === "FAILED" && attemptCount <= maxRetries && failurePolicy !== "REFUND") {
      retry = true;
      tx.set(projectRef, { generationStatus: "QUEUED", lastError: body.error || "Generation failed", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      tx.set(jobRef, { status: "QUEUED", attemptCount, lastError: body.error || null, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return;
    }
    if (body.status === "FAILED" && failurePolicy !== "RETRY_ONLY") {
      const walletRef = adminDb.collection("wallets").doc(project.data()!.userId);
      const orderRef = adminDb.collection("storytellerOrders").doc(project.data()!.orderId);
      const orderBefore = await tx.get(orderRef);
      const revenueWalletRef = orderBefore.data()?.revenueRecipientUid ? adminDb.collection("wallets").doc(orderBefore.data()!.revenueRecipientUid) : null;
      const [wallet, revenueWallet] = await Promise.all([tx.get(walletRef), revenueWalletRef ? tx.get(revenueWalletRef) : Promise.resolve(null)]);
      const order = orderBefore;
      if (order.data()?.paymentStatus !== "REFUNDED") {
        const amount = Number(order.data()?.amountPaid || project.data()?.amountPaid || 0);
        tx.set(walletRef, { balance: Number(wallet.data()?.balance || 0) + amount }, { merge: true });
        if (revenueWalletRef) tx.set(revenueWalletRef, { balance: Number(revenueWallet?.data()?.balance || 0) - amount }, { merge: true });
        tx.update(orderRef, { paymentStatus: "REFUNDED", refundedAt: FieldValue.serverTimestamp(), refundReason: body.error || "Permanent generation failure" });
        tx.create(adminDb.collection("transactions").doc(), { user: project.data()!.userId, orderId: orderRef.id, projectId: body.projectId, amount, currency: order.data()?.currency || "INR", referenceId: `STORYTELLER_REFUND_${orderRef.id}`, date: FieldValue.serverTimestamp(), description: "StoryTeller AI Reel Refund", status: "Completed", type: "refund" });
        tx.set(analyticsRef, { refunds: FieldValue.increment(1), totalRevenue: FieldValue.increment(-amount), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      }
      tx.set(projectRef, { paymentStatus: "REFUNDED", generationStatus: "REFUNDED", lastError: body.error || null, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      tx.set(jobRef, { status: "REFUNDED", attemptCount, lastError: body.error || null, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return;
    }
    tx.set(projectRef, { generationStatus: body.status, generationStage: body.status === "READY" ? "READY" : body.status, finalAssetPath: body.status === "READY" ? body.finalAssetPath : project.data()?.finalAssetPath || null, lastError: body.error || null, estimatedVoiceCost: body.estimatedVoiceCost || null, estimatedRenderingCost: body.estimatedRenderingCost || null, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    tx.set(jobRef, { status: body.status, attemptCount, lastError: body.error || null, updatedAt: FieldValue.serverTimestamp(), completedAt: body.status === "READY" ? FieldValue.serverTimestamp() : null }, { merge: true });
    if (body.status === "READY") tx.set(analyticsRef, { paidReelsGenerated: FieldValue.increment(1), estimatedVoiceCost: FieldValue.increment(body.estimatedVoiceCost || 0), estimatedRenderingCost: FieldValue.increment(body.estimatedRenderingCost || 0), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    if (body.status === "FAILED") tx.set(analyticsRef, { failedGenerations: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
  if (retry) {
    await dispatchStorytellerRenderer(body.projectId);
  }
  return NextResponse.json({ success: true });
}
