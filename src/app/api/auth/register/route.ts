import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/firebase/admin-init';
import { FieldValue } from 'firebase-admin/firestore';
import { resolveReferralCode } from '@/lib/referral-code';
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
 try {
 const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
 if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 let identity; try { identity = await adminAuth.verifyIdToken(token); } catch { return NextResponse.json({error:'Unauthorized'}, {status:401}); }
 const body = await request.json();
 if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 150 || typeof body.phone !== 'string' || body.phone.length > 25) return NextResponse.json({error:'Invalid registration details.'},{status:400});
 const userRef = adminDb.collection('users').doc(identity.uid);
 // Existing accounts cannot be re-registered or change their attribution.
 if ((await userRef.get()).exists) return NextResponse.json({success:true,alreadyRegistered:true});
 const referral = await resolveReferralCode(body.referralCode, identity.uid);
 await adminDb.runTransaction(async tx => {
 const walletRef = adminDb.collection('wallets').doc(identity.uid), boltRef = adminDb.collection('referbolt').doc(identity.uid);
 const [existing, wallet, bolt] = await Promise.all([tx.get(userRef),tx.get(walletRef),tx.get(boltRef)]);
 if (existing.exists) return;
 const code = wallet.data()?.referralCode || `REF${identity.uid.toUpperCase()}`;
 tx.create(userRef,{id:identity.uid,name:body.name.trim(),email:identity.email || '',phone:body.phone.trim(),joinDate:new Date().toISOString(),status:'Active',referredBy:referral?.uid || null,referralRewardStatus:referral ? 'PENDING_SUBSCRIPTION':'NOT_APPLICABLE',createdAt:FieldValue.serverTimestamp()});
 if (!wallet.exists) tx.create(walletRef,{balance:0,coins:50,referralCode:code});
 if (!bolt.exists) tx.create(boltRef,{isSubscribed:false,referralCode:code,totalCommissions:0,totalReferrals:0,cycleProgress:0,cycleGoal:3,autoRenew:false,referralHistory:[]});
 });
 return NextResponse.json({success:true,rewardStatus:referral?'PENDING_SUBSCRIPTION':'NOT_APPLICABLE'});
 } catch(error) { return NextResponse.json({error:error instanceof Error?error.message:'Registration failed.'},{status:400}); }
}
