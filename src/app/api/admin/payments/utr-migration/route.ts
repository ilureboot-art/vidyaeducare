import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { FieldPath, FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/firebase/admin-init';
import { verifyRequester, RequestAuthError } from '@/lib/server-auth';
import { normalizeUtr, paymentAmount } from '@/lib/payment-validation';
import { validId, TestEngineError } from '@/lib/server-test-engine';
const hash=(v:unknown)=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
export async function POST(request:NextRequest) {
 try {
  const actor=await verifyRequester(request,true);const body=await request.json();
  if(!['preview','apply'].includes(body.action))throw new RequestAuthError('Choose preview or apply.',400);
  const cursor=body.cursor ? validId(body.cursor):null;
  const migration=adminDb.doc('paymentMigrations/utr');
  const result=await adminDb.runTransaction(async tx=>{
   const state=await tx.get(migration);
   const effectiveCursor=body.cursor === undefined ? state.data()?.cursor || null : cursor;
   if(body.action==='apply' && (state.data()?.cursor||null)!==effectiveCursor)throw new RequestAuthError('Migration cursor changed. Preview the next page.',409);
   if(state.data()?.status==='COMPLETE')return {complete:true,nextCursor:null,rows:[],applied:false};
   let query=adminDb.collection('transactions').orderBy(FieldPath.documentId()).limit(100);if(effectiveCursor)query=query.startAfter(effectiveCursor);
   const page=await tx.get(query);const blockers:{id:string;reason:string}[]=[];
   const entries=page.docs.flatMap(d=>{const v=d.data();if(v.type!=='deposit')return [];try {const utr=normalizeUtr(v.referenceId),amount=paymentAmount(v.amount);if(typeof v.user!=='string'||!v.user)throw Error();return [{id:d.id,utr,amount,user:v.user,claim:adminDb.doc(`paymentUtrClaims/${hash(`incoming:${utr}`)}`)}];}catch {blockers.push({id:d.id,reason:'INVALID_LEGACY_REFERENCE_OR_AMOUNT'});return [];}});
   const claims=await Promise.all(entries.map(e=>tx.get(e.claim)));const seen=new Map<string,string>();
   entries.forEach((e,i)=>{const previous=seen.get(e.claim.path);if(previous && previous!==e.id)blockers.push({id:e.id,reason:'DUPLICATE_LEGACY_REFERENCE'});seen.set(e.claim.path,e.id);if(claims[i].exists && (claims[i].data()?.transactionId!==e.id || claims[i].data()?.userId!==e.user || claims[i].data()?.amount!==e.amount))blockers.push({id:e.id,reason:'EXISTING_CLAIM_CONFLICT'});});
   const previewHash=hash({cursor:effectiveCursor,rows:page.docs.map(d=>[d.id,d.updateTime.toDate().toISOString(),d.data()]),claims:claims.map(c=>c.data()||null)});
   const nextCursor=page.size===100?page.docs.at(-1)!.id:null;
   if(body.action==='apply') {
    if(body.previewHash!==previewHash)throw new RequestAuthError('The source changed. Preview again.',409);
    if(blockers.length)throw new RequestAuthError('Resolve legacy reference conflicts before indexing this page.',409);
    entries.forEach((e,i)=>{if(!claims[i].exists)tx.create(e.claim,{transactionId:e.id,userId:e.user,amount:e.amount,normalizedUtr:e.utr,namespace:'incoming',claimedAt:FieldValue.serverTimestamp(),migration:true});});
    tx.set(migration,{cursor:nextCursor,status:nextCursor?'IN_PROGRESS':'COMPLETE',updatedAt:FieldValue.serverTimestamp(),actorId:actor.uid},{merge:true});
    tx.create(adminDb.collection('adminAuditLogs').doc(),{action:'UTR_INDEX_MIGRATION_PAGE',actorId:actor.uid,fromCursor:effectiveCursor,nextCursor,indexed:entries.length,previewHash,timestamp:FieldValue.serverTimestamp()});
   }
   return {complete:nextCursor===null,fromCursor:effectiveCursor,previewHash,nextCursor,scanned:page.size,indexable:entries.length,blockers,applied:body.action==='apply'};
  });return NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});
 }catch(e){return NextResponse.json({error:e instanceof RequestAuthError||e instanceof TestEngineError?e.message:'Unable to review UTR index migration.'},{status:e instanceof RequestAuthError||e instanceof TestEngineError?e.status:500});}
}
