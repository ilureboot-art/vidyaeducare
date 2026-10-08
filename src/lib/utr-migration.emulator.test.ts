import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { NextRequest } from 'next/server';
const enabled=process.env.RUN_PROFILE_RULES_EMULATOR==='1' && process.env.FIRESTORE_EMULATOR_HOST==='127.0.0.1:9081';
const h=vi.hoisted(()=>({db:null as any}));
vi.mock('@/firebase/admin-init',()=>({get adminDb(){return h.db;}}));
vi.mock('@/lib/server-auth',()=>({verifyRequester:async()=>({uid:'utr_owner'}),RequestAuthError:class extends Error { constructor(message:string,public status:number){super(message);} }}));
import { POST as migrate } from '@/app/api/admin/payments/utr-migration/route';
import { POST as deposit } from '@/app/api/wallet/deposit/route';
const call=(route:(request:NextRequest)=>Promise<Response>,body:any)=>route(new NextRequest('http://localhost/api/admin/payments/utr-migration',{method:'POST',body:JSON.stringify(body)}));
describe.skipIf(!enabled)('UTR index migration',()=>{
 let app:ReturnType<typeof initializeApp>,db:ReturnType<typeof getFirestore>;
 beforeAll(async()=>{app=initializeApp({projectId:'demo-vidya-profile-rules'},'utr-tests');db=getFirestore(app);h.db=db;await db.doc('transactions/utr_legacy_one').set({user:'utr_owner',type:'deposit',amount:100,referenceId:' abc 123 ',status:'Completed'});await db.doc('transactions/utr_duplicate').set({user:'another',type:'deposit',amount:100,referenceId:'ABC123',status:'Pending'});});
 afterAll(async()=>{await db.terminate();await deleteApp(app);});
 it('previews without writes, rejects collisions, atomically indexes and prevents duplicate deposits',async()=>{
  const p=await (await call(migrate,{action:'preview'})).json();expect(p.blockers.some((b:any)=>b.reason==='DUPLICATE_LEGACY_REFERENCE')).toBe(true);expect((await db.doc('paymentMigrations/utr').get()).exists).toBe(false);
  expect((await call(migrate,{action:'apply',previewHash:p.previewHash,cursor:p.fromCursor})).status).toBe(409);
  await db.doc('transactions/utr_duplicate').delete();const clear=await (await call(migrate,{action:'preview'})).json();expect(clear.blockers).toEqual([]);expect((await call(migrate,{action:'apply',previewHash:p.previewHash})).status).toBe(409);
  expect((await call(migrate,{action:'apply',previewHash:clear.previewHash,cursor:clear.fromCursor})).ok).toBe(true);expect((await db.doc('paymentMigrations/utr').get()).data()?.status).toBe('COMPLETE');
  const retry=await call(deposit,{amount:100,referenceId:'ABC123'});expect(retry.ok).toBe(true);expect((await retry.json()).replayed).toBe(true);
  expect((await call(deposit,{amount:200,referenceId:'ABC123'})).status).toBe(409);
 });
});
