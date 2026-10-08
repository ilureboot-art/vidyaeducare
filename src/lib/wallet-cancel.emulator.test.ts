import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { NextRequest } from 'next/server';
const enabled=process.env.RUN_PROFILE_RULES_EMULATOR==='1' && process.env.FIRESTORE_EMULATOR_HOST==='127.0.0.1:9081';
const h=vi.hoisted(()=>({db:null as any,uid:'cancel_owner'}));
vi.mock('@/firebase/admin-init',()=>({get adminDb(){return h.db;}}));
vi.mock('@/lib/server-auth',()=>({verifyRequester:async()=>({uid:h.uid}),RequestAuthError:class extends Error { constructor(message:string,public status:number){super(message);} }}));
import { POST } from '@/app/api/wallet/withdraw/cancel/route';
const call=(id:string)=>POST(new NextRequest('http://localhost/api/wallet/withdraw/cancel',{method:'POST',body:JSON.stringify({transactionId:id})}));
describe.skipIf(!enabled)('withdrawal cancellation transactions',()=>{
 let app:ReturnType<typeof initializeApp>,db:ReturnType<typeof getFirestore>;
 beforeAll(async()=>{app=initializeApp({projectId:'demo-vidya-profile-rules'},'cancel-tests');db=getFirestore(app);h.db=db;await db.doc('wallets/cancel_owner').set({balance:200,reservedBalance:650});await db.doc('transactions/cancel_pending').set({user:'cancel_owner',type:'withdrawal',amount:-650,status:'Pending',reservationApplied:true});});
 afterAll(async()=>{await db.terminate();await deleteApp(app);});
 it('rejects another owner and releases a reservation once under concurrent retries',async()=>{h.uid='other';expect((await call('cancel_pending')).status).toBe(404);h.uid='cancel_owner';const results=await Promise.all([call('cancel_pending'),call('cancel_pending')]);expect(results.every(r=>r.ok)).toBe(true);expect((await db.doc('wallets/cancel_owner').get()).data()).toMatchObject({balance:850,reservedBalance:0});expect((await db.doc('transactions/cancel_pending').get()).data()?.status).toBe('Cancelled');});
 it('refuses completed or unreserved legacy requests',async()=>{await db.doc('transactions/cancel_completed').set({user:h.uid,type:'withdrawal',amount:-650,status:'Completed',reservationApplied:true});await db.doc('transactions/cancel_legacy').set({user:h.uid,type:'withdrawal',amount:-650,status:'Pending'});expect((await call('cancel_completed')).status).toBe(409);expect((await call('cancel_legacy')).status).toBe(409);});
});
