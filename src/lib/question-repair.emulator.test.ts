import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { NextRequest } from 'next/server';
const enabled=process.env.RUN_PROFILE_RULES_EMULATOR==='1'&&process.env.FIRESTORE_EMULATOR_HOST==='127.0.0.1:9081';
const h=vi.hoisted(()=>({db:null as any}));
vi.mock('@/firebase/admin-init',()=>({get adminDb(){return h.db;}}));
vi.mock('@/lib/server-auth',()=>({verifyRequester:async()=>({uid:'academic_repair'}),RequestAuthError:class extends Error {constructor(message:string,public status:number){super(message);}}}));
import { POST } from '@/app/api/admin/question-bank/repair/route';
const call=(body:any)=>POST(new NextRequest('http://localhost/api/admin/question-bank/repair',{method:'POST',body:JSON.stringify(body)}));
describe.skipIf(!enabled)('private transactional question repairs',()=>{
 let app:ReturnType<typeof initializeApp>,db:ReturnType<typeof getFirestore>;
 const q={id:'repair_q',text:{en:'Q',mr:'प्रश्न'},options:{en:['First','Second'],mr:['पहिला','दुसरा']},correctAnswer:{en:'Option B',mr:'पर्याय ब'}};
 beforeAll(async()=>{app=initializeApp({projectId:'demo-vidya-profile-rules'},'repair-tests');db=getFirestore(app);h.db=db;await db.doc('testSets/repair_set').set({questions:[q]});});
 afterAll(async()=>{await db.terminate();await deleteApp(app);});
 it('preview hides keys and source; stale previews fail; applying backs up atomically and cannot replay',async()=>{
  const p=await(await call({action:'preview',setId:'repair_set'})).json();expect(p.ready).toBe(true);expect(JSON.stringify(p)).not.toContain('Second');expect((await db.collection('questionRepairBackups').get()).empty).toBe(true);
  await db.doc('testSets/repair_set').update({name:'Changed'});expect((await call({action:'apply',setId:'repair_set',previewHash:p.previewHash})).status).toBe(409);
  const fresh=await(await call({action:'preview',setId:'repair_set'})).json();expect((await call({action:'apply',setId:'repair_set',previewHash:fresh.previewHash})).ok).toBe(true);
  const current=(await db.doc('testSets/repair_set').get()).data()!;expect(current.questions[0].correctAnswer.en).toBe('Second');const backup=(await db.doc(`questionRepairBackups/${current.lastRepairId}`).get()).data()!;expect(backup.source.questions[0].correctAnswer.en).toBe('Option B');expect((await call({action:'apply',setId:'repair_set',previewHash:fresh.previewHash})).status).toBe(409);
 });
});
