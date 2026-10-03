import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin-init";
import { RequestAuthError, verifyRequester } from "@/lib/server-auth";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
 try {
  await verifyRequester(request,true);
  let database="Operational";
  try {await adminDb.collection("configs").limit(1).get();}catch {database="Unavailable";}
  const renderer=Boolean(process.env.STORYTELLER_RENDERER_URL && process.env.STORYTELLER_RENDERER_SECRET);
  return NextResponse.json({checkedAt:new Date().toISOString(),checks:[
   {name:"Admin authentication",status:"Operational",detail:"This request passed server-side administrator verification."},
   {name:"Database",status:database,detail:"Read-only check against the application database."},
   {name:"StoryTeller renderer configuration",status:renderer?"Configured":"Not configured",detail:"Configuration presence only; renderer/provider health is not verified."},
   {name:"AI provider",status:"Not verified",detail:"No paid generation request was performed."},
   {name:"Payment processing",status:"Not verified",detail:"Verify actual payment requests in Transactions."}
  ]},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return NextResponse.json({error:error instanceof RequestAuthError?error.message:"System check failed."},{status:error instanceof RequestAuthError?error.status:500});}
}
