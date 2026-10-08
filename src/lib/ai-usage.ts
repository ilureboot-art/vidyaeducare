import { createHash, randomUUID } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/firebase/admin-init';
import { adminPermissions } from './admin-permissions';
import { assertActivationEvidence } from './student-entitlement';

export type AiFeature = 'doubt' | 'notes' | 'questions';
export type AiRequestAccess = { token?: string; requestId: string; studentId?: string };
export class AiUsageError extends Error {}
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
const future = (v: any, now: number) => {
  const date = v?.toDate ? v.toDate() : new Date(v);
  return Number.isFinite(date.getTime()) && date.getTime() > now;
};
export function validateAiInput(input: unknown) {
  const json = JSON.stringify(input);
  if (!json || json.length > 1_500_000) throw new AiUsageError('Study material is too large. Use a smaller image or text.');
  const visit = (v: any) => {
    if (typeof v === 'string') {
      if (v.startsWith('data:')) {
        if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(v) || v.length > 1_400_000) throw new AiUsageError('Use a PNG, JPEG or WebP image below 1 MB.');
      } else if (v.length > 12000 || /^https?:\/\//i.test(v)) throw new AiUsageError('Use text below 12,000 characters; remote image URLs are not accepted.');
    } else if (Array.isArray(v)) {
      if (v.length > 30) throw new AiUsageError('Too many topics or choices.');
      v.forEach(visit);
    } else if (v && typeof v === 'object') Object.values(v).forEach(visit);
  };
  visit(input);
}

/** All exported AI server actions pass this gateway before any provider call. */
export async function withAiUsage<T>(feature: AiFeature, input: unknown, access: AiRequestAccess | undefined, generate: () => Promise<T>): Promise<T> {
  validateAiInput(input);
  if (!access || !/^[a-zA-Z0-9_-]{16,100}$/.test(access.requestId)) throw new AiUsageError('Reload the page and submit a new request.');
  const now = Date.now(), day = new Date(now).toISOString().slice(0, 10);
  let uid: string | null = null, academic = false;
  if (access.token) {
    try {
      const token = await adminAuth.verifyIdToken(access.token, true); uid = token.uid;
      const master = token.email_verified === true && ['admin@vidyaeducare.com', 'headadmin@vidyaeducare.com'].includes((token.email || '').toLowerCase());
      const role = master ? null : (await adminDb.doc(`admins/${uid}`).get()).data();
      academic = adminPermissions(role?.role, role?.status, master).includes('academic');
    } catch { throw new AiUsageError('Your sign-in expired. Sign in again.'); }
  }
  if (feature === 'questions' && !academic) throw new AiUsageError('Academic administrator access is required.');
  const cookieStore = cookies();
  let guest = cookieStore.get('vidya_ai_trial')?.value;
  if (!uid && (!guest || !/^[a-f0-9-]{36}$/.test(guest))) {
    guest = randomUUID(); cookieStore.set('vidya_ai_trial', guest, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 31536000, path: '/' });
  }
  const identity = hash(uid ? `user:${uid}` : `guest:${guest}`);
  const forwarded = headers().get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const network = hash(`${process.env.FIREBASE_PROJECT_ID || 'vidyaeducare'}:${forwarded}`);
  const requestRef = adminDb.doc(`aiUsageRequests/${hash(`${identity}:${feature}:${access.requestId}`)}`);
  const inputHash = hash(JSON.stringify(input));
  const reservation = await adminDb.runTransaction(async tx => {
    const [existing, config, account, entitlement, store] = await Promise.all([
      tx.get(requestRef), tx.get(adminDb.doc('configs/aiUsage')), uid ? tx.get(adminDb.doc(`users/${uid}`)) : null,
      uid ? tx.get(adminDb.doc(`aiAccess/${uid}`)) : null, tx.get(adminDb.doc('configs/store')),
    ]);
    if (uid && !academic && (!account?.exists || ['Banned', 'Inactive'].includes(account.data()?.status))) throw new AiUsageError('Account access is unavailable.');
    const policy = config.data() || {};
    if (policy.enabled === false) throw new AiUsageError('AI tools are temporarily paused.');
    if (existing.exists) {
      const data = existing.data()!;
      if (data.inputHash !== inputHash) throw new AiUsageError('Request ID cannot be reused for changed material.');
      if (data.status === 'COMPLETE') return { cached: true as const, output: data.output as T };
      throw new AiUsageError(data.status === 'RUNNING' ? 'This request is already processing. Retry with the same request after a moment.' : 'This attempt failed. Submit a new request when service is available.');
    }
    let paid = academic || future(entitlement?.data()?.[feature === 'doubt' ? 'doubtSolverExpiresAt' : 'notesGeneratorExpiresAt'], now);
    if (!paid && uid && access.studentId && /^[A-Za-z0-9_-]{1,150}$/.test(access.studentId) && store.data()?.grantFreeAiToolsWithMockArena === true) {
      const [student, ent] = await Promise.all([tx.get(adminDb.doc(`students/${access.studentId}`)), tx.get(adminDb.doc(`studentEntitlements/${access.studentId}`))]);
      const e = ent.data();
      const order = e?.purchaseTransactionId && /^[A-Za-z0-9_-]{1,150}$/.test(e.purchaseTransactionId) ? (await tx.get(adminDb.doc(`transactions/${e.purchaseTransactionId}`))).data() : null;
      try { paid = student.data()?.parentId === uid && !student.data()?.archived && e?.status === 'ACTIVE' && assertActivationEvidence(e, order, uid).verifiedPaid; } catch { paid = false; }
    }
    // Signed-in unpaid accounts and guests retain five persisted trial requests per tool.
    const limit = (value: unknown, fallback: number, ceiling: number) => Number.isInteger(value) && Number(value) > 0 ? Math.min(Number(value), ceiling) : fallback;
    const quotaRef = adminDb.doc(`aiUsageCounters/${identity}-${feature}-${paid ? day : 'trial'}`);
    const globalRef = adminDb.doc(`aiUsageCounters/global-${day}`);
    const networkRef = adminDb.doc(`aiUsageCounters/network-${network}-${day}`);
    const [quota, global, ip] = await Promise.all([tx.get(quotaRef), tx.get(globalRef), tx.get(networkRef)]);
    const max = paid ? limit(policy.paidDailyRequests, 100, 500) : 5;
    if ((quota.data()?.count || 0) >= max) throw new AiUsageError(paid ? 'Daily fair-use limit reached. Try again tomorrow.' : 'Your five trial requests are used. Purchase access to continue.');
    if ((global.data()?.count || 0) >= limit(policy.globalDailyRequests, 1000, 5000)) throw new AiUsageError('Daily AI service budget reached. Please try tomorrow.');
    if (!paid && (ip.data()?.count || 0) >= limit(policy.guestNetworkDailyRequests, 20, 100)) throw new AiUsageError('Trial request limit for this network reached. Sign in with paid access or try tomorrow.');
    if (now - (quota.data()?.lastRequestAt || 0) < 3000) throw new AiUsageError('Please wait a few seconds between requests.');
    [quotaRef, globalRef, ...(!paid ? [networkRef] : [])].forEach(ref => tx.set(ref, { count: FieldValue.increment(1), lastRequestAt: now }, { merge: true }));
    tx.create(requestRef, { identity, feature, inputHash, status: 'RUNNING', startedAt: now, expiresAt: Timestamp.fromMillis(now + 86400000) });
    return { cached: false as const };
  });
  if (reservation.cached) return reservation.output;
  try {
    const output = await generate();
    if (JSON.stringify(output).length > 100000) throw new AiUsageError('Generated material exceeded the safe output limit.');
    await requestRef.update({ status: 'COMPLETE', output, completedAt: Date.now() });
    return output;
  } catch {
    await requestRef.update({ status: 'FAILED', completedAt: Date.now() });
    // Failed provider calls still consume the reservation: retries cannot evade spend limits.
    throw new AiUsageError('AI service could not complete this request. Please try again later.');
  }
}

/** Read-only quota display. Provider actions independently recheck/reserve in a transaction. */
export async function readAiUsage(feature: 'doubt' | 'notes', access: { token?: string; studentId?: string }) {
 let uid: string | null = null, academic = false;
 if (access.token) {
  try { const token = await adminAuth.verifyIdToken(access.token, true); uid = token.uid; const master=token.email_verified===true && ['admin@vidyaeducare.com','headadmin@vidyaeducare.com'].includes((token.email||'').toLowerCase());const a=master?null:(await adminDb.doc(`admins/${uid}`).get()).data();academic=adminPermissions(a?.role,a?.status,master).includes('academic'); }
  catch {throw new AiUsageError('Your sign-in expired. Sign in again.');}
 }
 const [account, entitlement, store, config] = await Promise.all([uid?adminDb.doc(`users/${uid}`).get():null,uid?adminDb.doc(`aiAccess/${uid}`).get():null,adminDb.doc('configs/store').get(),adminDb.doc('configs/aiUsage').get()]);
 if(uid && !academic && (!account?.exists || ['Banned','Inactive'].includes(account.data()?.status))) throw new AiUsageError('Account access is unavailable.');
 let paid=academic || future(entitlement?.data()?.[feature==='doubt'?'doubtSolverExpiresAt':'notesGeneratorExpiresAt'],Date.now());
 if(!paid && uid && access.studentId && /^[A-Za-z0-9_-]{1,150}$/.test(access.studentId) && store.data()?.grantFreeAiToolsWithMockArena===true) {
  const [student, entitlement] = await Promise.all([adminDb.doc(`students/${access.studentId}`).get(),adminDb.doc(`studentEntitlements/${access.studentId}`).get()]);const e=entitlement.data();const order=e?.purchaseTransactionId && /^[A-Za-z0-9_-]{1,150}$/.test(e.purchaseTransactionId)?(await adminDb.doc(`transactions/${e.purchaseTransactionId}`).get()).data():null;
  try {paid=student.data()?.parentId===uid && !student.data()?.archived && e?.status==='ACTIVE' && assertActivationEvidence(e,order,uid).verifiedPaid;} catch {paid=false;}
 }
 const cs=cookies();let guest=cs.get('vidya_ai_trial')?.value;
 if(!uid && (!guest || !/^[a-f0-9-]{36}$/.test(guest))) {guest=randomUUID();cs.set('vidya_ai_trial',guest,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',maxAge:31536000,path:'/'});}
 const identity=hash(uid?`user:${uid}`:`guest:${guest}`), day=new Date().toISOString().slice(0,10);
 const quota=await adminDb.doc(`aiUsageCounters/${identity}-${feature}-${paid?day:'trial'}`).get();const policy=config.data()||{};
 const limit=paid && Number.isInteger(policy.paidDailyRequests) && policy.paidDailyRequests>0?Math.min(policy.paidDailyRequests,500):paid?100:5;
 return {mode:paid?'PAID':'TRIAL',limit,used:quota.data()?.count||0,remaining:Math.max(0,limit-(quota.data()?.count||0)),enabled:policy.enabled!==false,period:paid?'UTC_DAY':'LIFETIME'};
}
