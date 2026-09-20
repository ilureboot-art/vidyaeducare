import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin-init";
import { RequestAuthError, verifyRequester } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    await verifyRequester(request, true);
    const snap = await adminDb.collection("storytellerAnalytics").doc("totals").get();
    const data = snap.data() || {};
    const purchases=Number(data.successfulPurchases||0), revenue=Number(data.totalRevenue||0), voice=Number(data.estimatedVoiceCost||0), rendering=Number(data.estimatedRenderingCost||0);
    return NextResponse.json({ analytics:{...data,averageSellingPrice:purchases?revenue/purchases:0,estimatedGrossMargin:revenue-voice-rendering} });
  } catch(error){const status=error instanceof RequestAuthError?error.status:500;return NextResponse.json({error:error instanceof Error?error.message:"Analytics failed."},{status});}
}
