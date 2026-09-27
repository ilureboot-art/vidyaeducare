import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/admin-init";
import { RequestAuthError, verifyRequester } from "@/lib/server-auth";
import { defaultStorytellerConfig, SANJAY_CUSTOM_VOICE_ID, STORYTELLER_CONFIG_ID, StorytellerConfig, StorytellerInput, validateStorytellerInput } from "@/lib/storyteller";
import { dispatchStorytellerRenderer } from "@/lib/storyteller-renderer";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequester(request);
    const body = await request.json() as StorytellerInput & { idempotencyKey: string };
    if (!/^[A-Za-z0-9_-]{12,100}$/.test(body.idempotencyKey || "")) return NextResponse.json({ error: "Invalid payment request identifier." }, { status: 400 });
    const configSnap = await adminDb.collection("configs").doc(STORYTELLER_CONFIG_ID).get();
    const config = configSnap.exists ? { ...defaultStorytellerConfig, ...configSnap.data() } as StorytellerConfig : defaultStorytellerConfig;
    if (!config.enabled) return NextResponse.json({ error: "StoryTeller AI is currently unavailable." }, { status: 503 });
    if (!config.voiceProviderEnabled) return NextResponse.json({ error: "Audio-reel narration is currently unavailable." }, { status: 503 });
    if (!process.env.STORYTELLER_RENDERER_URL || !process.env.STORYTELLER_RENDERER_SECRET) return NextResponse.json({ error: "StoryTeller rendering is not configured. No payment was deducted." }, { status: 503 });
    const autoDuration = String(body.duration) === "AUTO";
    const input: StorytellerInput = { title: body.title, story: body.story, language: body.language, voice: body.voice, voiceStyle: body.voiceStyle, duration: autoDuration && config.allowAutoDuration ? config.maxDuration : Number(body.duration), music: body.music, template: body.template };
    const errors = validateStorytellerInput(input, config);
    if (errors.length) return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    if (input.voice === SANJAY_CUSTOM_VOICE_ID && process.env.STORYTELLER_CUSTOM_VOICE_READY !== "true") {
      return NextResponse.json({ error: "The selected custom narrator is not ready for this language. No payment was deducted." }, { status: 503 });
    }

    const requestRef = adminDb.collection("storytellerPurchaseRequests").doc(`${user.uid}_${body.idempotencyKey}`);
    const adminUid = await resolveHeadAdminUid();
    const walletRef = adminDb.collection("wallets").doc(user.uid);
    const projectRef = adminDb.collection("storytellerProjects").doc();
    const orderRef = adminDb.collection("storytellerOrders").doc();
    const walletTxRef = adminDb.collection("transactions").doc();
    const jobRef = adminDb.collection("storytellerJobs").doc(projectRef.id);
    const analyticsRef = adminDb.collection("storytellerAnalytics").doc("totals");
    let replay: { projectId: string; orderId: string } | null = null;

    await adminDb.runTransaction(async tx => {
      const adminWalletRef = adminUid ? adminDb.collection("wallets").doc(adminUid) : null;
      const [prior, wallet, adminWallet] = await Promise.all([tx.get(requestRef), tx.get(walletRef), adminWalletRef ? tx.get(adminWalletRef) : Promise.resolve(null)]);
      if (prior.exists) {
        const data = prior.data()!;
        replay = { projectId: data.projectId, orderId: data.orderId };
        return;
      }
      const balance = Number(wallet.data()?.balance || 0);
      if (balance < config.reelPrice) throw new InsufficientFundsError(config.reelPrice, balance);
      tx.update(walletRef, { balance: balance - config.reelPrice });
      if (adminWalletRef) {
        tx.set(adminWalletRef, { balance: Number(adminWallet?.data()?.balance || 0) + config.reelPrice }, { merge: true });
        tx.create(adminDb.collection("transactions").doc(), { user: adminUid, orderId: orderRef.id, projectId: projectRef.id, amount: config.reelPrice, currency: config.currency, date: FieldValue.serverTimestamp(), description: "Revenue: StoryTeller AI Reel", status: "Completed", type: "deposit" });
      }
      tx.create(projectRef, { ...input, requestedDuration: autoDuration ? "AUTO" : input.duration, userId: user.uid, orderId: orderRef.id, amountPaid: config.reelPrice, currency: config.currency, paymentStatus: "PAID", generationStatus: "QUEUED", generationStage: "PAYMENT_CONFIRMED", attemptCount: 0, finalAssetPath: null, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      tx.create(orderRef, { userId: user.uid, projectId: projectRef.id, configuredPriceAtCheckout: config.reelPrice, amountPaid: config.reelPrice, currency: config.currency, walletTransactionId: walletTxRef.id, revenueRecipientUid: adminUid, paymentStatus: "PAID", paidAt: FieldValue.serverTimestamp() });
      tx.create(walletTxRef, { user: user.uid, orderId: orderRef.id, projectId: projectRef.id, amount: -config.reelPrice, currency: config.currency, referenceId: `STORYTELLER_REEL_${orderRef.id}`, date: FieldValue.serverTimestamp(), description: "StoryTeller AI Reel Purchase", status: "Completed", type: "Purchase" });
      tx.create(jobRef, { userId: user.uid, projectId: projectRef.id, orderId: orderRef.id, status: "QUEUED", attemptCount: 0, maxRetries: config.automaticRetryCount, failurePolicy: config.failurePolicy, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      tx.create(requestRef, { userId: user.uid, projectId: projectRef.id, orderId: orderRef.id, createdAt: FieldValue.serverTimestamp() });
      tx.set(analyticsRef, { checkoutStarted: FieldValue.increment(1), successfulPurchases: FieldValue.increment(1), totalRevenue: FieldValue.increment(config.reelPrice), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    });

    const result = replay || { projectId: projectRef.id, orderId: orderRef.id };
    if (!replay) void dispatchStorytellerRenderer(result.projectId).catch(async error => {
      console.error("StoryTeller renderer dispatch failed", error);
      await adminDb.collection("storytellerProjects").doc(result.projectId).set({ generationStatus: "DISPATCH_FAILED", lastError: error instanceof Error ? error.message : "Dispatch failed", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      await adminDb.collection("storytellerJobs").doc(result.projectId).set({ status: "DISPATCH_FAILED", lastError: error instanceof Error ? error.message : "Dispatch failed", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    });
    return NextResponse.json({ success: true, ...result, replayed: Boolean(replay) });
  } catch (error) {
    if (error instanceof InsufficientFundsError) return NextResponse.json({ error: "Insufficient Wallet Balance", price: error.price, balance: error.balance, required: error.price - error.balance }, { status: 409 });
    const status = error instanceof RequestAuthError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout failed." }, { status });
  }
}

class InsufficientFundsError extends Error { constructor(public price: number, public balance: number) { super("Insufficient wallet balance."); } }

async function resolveHeadAdminUid() {
  const admins = await adminDb.collection("admins").where("role", "==", "Head Admin").limit(1).get();
  if (!admins.empty) return admins.docs[0].id;
  const users = await adminDb.collection("users").where("email", "==", "admin@vidyaeducare.com").limit(1).get();
  return users.empty ? null : users.docs[0].id;
}
