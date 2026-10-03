import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin-init";
import { RequestAuthError, verifyRequester } from "@/lib/server-auth";
export const dynamic = "force-dynamic";
const date = (v: any): string | null => { const d = v?.toDate?.() ?? (v ? new Date(v) : null); return d && Number.isFinite(d.getTime()) ? d.toISOString() : null; };
export async function GET(request: NextRequest) {
 try {
  await verifyRequester(request, true);
  const [payments, eligibility, payouts] = await Promise.all([
   adminDb.collection("transactions").where("status","==","Pending").limit(101).get(),
   adminDb.collection("ibaEligibility").where("status","==","ELIGIBLE_PENDING_APPROVAL").limit(101).get(),
   adminDb.collection("ibaPayouts").where("status","in",["PENDING_REVIEW","ON_HOLD"]).limit(101).get()
  ]);
  const groups = [
   payments.docs.slice(0,100).map(d=> {const v=d.data(); return {id:d.id,kind:"payment",title:v.description || "Payment request",status:v.status,createdAt:date(v.date || v.timestamp),amount:Number(v.amount || 0),actionUrl:`/admin/transactions?status=pending&id=${encodeURIComponent(d.id)}`};}),
   eligibility.docs.slice(0,100).map(d=>({id:d.id,kind:"eligibility",title:"IBA eligibility review",status:d.data().status,createdAt:date(d.data().updatedAt || d.data().createdAt),actionUrl:"/admin/iba-management"})),
   payouts.docs.slice(0,100).map(d=>({id:d.id,kind:"payout",title:"IBA payout review",status:d.data().status,createdAt:date(d.data().createdAt || d.data().calculatedAt),amount:Number(d.data().totalPayable || 0),actionUrl:"/admin/iba-management"}))
  ];
  return NextResponse.json({items:groups.flat(),truncated:[payments,eligibility,payouts].some(s=>s.size>100),checkedAt:new Date().toISOString()},{headers:{"Cache-Control":"no-store"}});
 } catch(error) {return NextResponse.json({error:error instanceof RequestAuthError ? error.message : "Unable to load approval requests."},{status:error instanceof RequestAuthError ? error.status : 500});}
}
