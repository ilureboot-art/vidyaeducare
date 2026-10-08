import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/firebase/admin-init';
import { verifyRequester, RequestAuthError } from '@/lib/server-auth';
import { validId, TestEngineError } from '@/lib/server-test-engine';
import { paymentAmount } from '@/lib/payment-validation';
export async function POST(request: NextRequest) {
 try {
  const { uid } = await verifyRequester(request); const body = await request.json();
  const ref=adminDb.collection('transactions').doc(validId(body.transactionId));
  const wallet=adminDb.collection('wallets').doc(uid);
  const result=await adminDb.runTransaction(async tx=>{
   const [snap,w]=await Promise.all([tx.get(ref),tx.get(wallet)]);const d=snap.data();
   if(!d || d.user!==uid) throw new RequestAuthError('Withdrawal not found.',404);
   if(d.type!=='withdrawal') throw new RequestAuthError('Only withdrawals can be cancelled.',409);
   if(d.status==='Cancelled') return {cancelled:true,replayed:true};
   if(d.status!=='Pending' || d.reservationApplied!==true) throw new RequestAuthError('Only a pending reserved withdrawal can be cancelled.',409);
   if (typeof d.amount !== 'number' || d.amount >= 0) throw new RequestAuthError('Withdrawal amount requires review.',409);
   const amount=paymentAmount(Math.abs(d.amount));const balance=Number(w.data()?.balance), reserved=Number(w.data()?.reservedBalance);
   if(!w.exists || !Number.isFinite(balance) || balance<0 || !Number.isFinite(reserved) || reserved<amount) throw new RequestAuthError('The wallet requires reconciliation before cancellation.',409);
   tx.update(wallet,{balance:Math.round((balance+amount)*100)/100,reservedBalance:Math.round((reserved-amount)*100)/100});
   tx.update(ref,{status:'Cancelled',cancelledAt:FieldValue.serverTimestamp(),cancelledBy:uid,reservationReleased:true});
   tx.create(adminDb.collection('adminAuditLogs').doc(),{action:'OWNER_WITHDRAWAL_CANCEL',actorId:uid,entityId:ref.id,amount,timestamp:FieldValue.serverTimestamp()});
   tx.create(adminDb.collection('notifications').doc(),{userId:uid,type:'withdrawal_cancelled',title:'Withdrawal cancelled',message:'Your reserved withdrawal amount is available again.',status:'unread',timestamp:FieldValue.serverTimestamp(),actionUrl:'/wallet',entityId:ref.id});
   return {cancelled:true,replayed:false};
  });return NextResponse.json(result);
 } catch(e) {return NextResponse.json({error:e instanceof RequestAuthError||e instanceof TestEngineError?e.message:'Unable to cancel withdrawal.'},{status:e instanceof RequestAuthError||e instanceof TestEngineError?e.status:500});}
}
