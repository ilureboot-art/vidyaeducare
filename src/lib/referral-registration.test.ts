import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ docs: new Map<string, any>(), writes: false, count:0 }));
vi.mock('@/firebase/admin-init', () => {
 const doc = (collection:string,id:string) => ({path:`${collection}/${id}`,id,get:async()=>snapshot(`${collection}/${id}`)});
 const snapshot=(path:string)=>({exists:state.docs.has(path),data:()=>state.docs.get(path)});
 const db={collection(name:string){return {doc:(id:string)=>doc(name,id),where(_field:string,_op:string,code:string){return {limit(){return {get:async()=>{const docs=[...state.docs.entries()].filter(([path,data])=>path.startsWith(name+'/') && data.referralCode===code).map(([path,data])=>({id:path.split('/')[1],data:()=>data}));return {size:docs.length,empty:!docs.length,docs};}}}}}}},async runTransaction(fn:any){state.writes=false;return fn({get:async(ref:any)=>{if(state.writes)throw Error('Read after write');return snapshot(ref.path)},create:(ref:any,data:any)=>{state.writes=true;if(state.docs.has(ref.path))throw Error('Exists');state.docs.set(ref.path,data);state.count++}})}};
 return {adminDb:db,adminAuth:{verifyIdToken:async()=>({uid:'buyer',email:'verified@example.com'})}};
});
vi.mock('firebase-admin/firestore',()=>({FieldValue:{serverTimestamp:()=>1}}));
import { POST } from '@/app/api/auth/register/route';
import { resolveReferralCode } from '@/lib/referral-code';
const request=(code='refABC')=>new NextRequest('http://localhost/api/auth/register',{method:'POST',headers:{Authorization:'Bearer test','Content-Type':'application/json'},body:JSON.stringify({name:'Buyer',email:'forged@example.com',phone:'1234567890',referralCode:code})});
beforeEach(()=>{state.docs=new Map([['wallets/referrer',{balance:20,referralCode:'REFABC'}],['users/referrer',{status:'Active'}]]);state.count=0;});
describe('registration referral safety',()=>{
 it('records pending attribution without credit and reads before writes',async()=>{expect((await POST(request())).status).toBe(200);expect(state.docs.get('wallets/buyer').balance).toBe(0);expect(state.docs.get('wallets/referrer').balance).toBe(20);expect(state.docs.get('users/buyer')).toMatchObject({referredBy:'referrer',referralRewardStatus:'PENDING_SUBSCRIPTION',email:'verified@example.com'});});
 it('repeat registration preserves balances and attribution',async()=>{await POST(request());state.docs.set('wallets/buyer',{balance:100,referralCode:'REFBUYER'});const count=state.count;await POST(request('INVALID'));expect(state.docs.get('wallets/buyer').balance).toBe(100);expect(state.count).toBe(count);});
 it('rejects invalid and self-referral codes',async()=>{expect((await POST(request('INVALID'))).status).toBe(400);await expect(resolveReferralCode('refabc','referrer')).rejects.toThrow('Self-referral');});
 it('rejects duplicate code ownership and inactive codes',async()=>{state.docs.set('wallets/duplicate',{referralCode:'REFABC'});await expect(resolveReferralCode('REFABC')).rejects.toThrow('Ambiguous');state.docs.delete('wallets/duplicate');state.docs.set('users/referrer',{status:'Banned'});await expect(resolveReferralCode('REFABC')).rejects.toThrow('inactive');});
});
