import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { NextRequest } from 'next/server';
import { activationClaimId } from './student-entitlement';
const enabled = process.env.RUN_PROFILE_RULES_EMULATOR === '1' && process.env.FIRESTORE_EMULATOR_HOST === '127.0.0.1:9081';
const handles = vi.hoisted(() => ({ db: null as any, uid: 'activation_owner' }));
vi.mock('@/firebase/admin-init', () => ({ get adminDb() { return handles.db; } }));
vi.mock('@/lib/server-auth', () => ({ verifyRequester: async () => ({ uid: handles.uid }), RequestAuthError: class extends Error {} }));
import { POST } from '@/app/api/students/route';
describe.skipIf(!enabled)('isolated server activation transactions', () => {
  let app: ReturnType<typeof initializeApp>, db: ReturnType<typeof getFirestore>;
  beforeAll(async () => {
    app = initializeApp({ projectId: 'demo-vidya-profile-rules' }, 'student-activation-tests'); db = getFirestore(app); handles.db = db;
    await db.doc('users/activation_owner').set({ status: 'Active' });
    await db.doc('users/activation_other').set({ status: 'Active' });
    await db.doc('transactions/activation_order').set({ user: 'activation_owner', type: 'Purchase', status: 'Completed', amount: -100, finalPrice: 100 });
    await db.doc(`studentActivationClaims/${activationClaimId('activation_owner', 'PROD-TEST123')}`).set({ parentId: 'activation_owner', status: 'AVAILABLE', purchaseTransactionId: 'activation_order', productId: 'annual', startsAt: '2026-01-01', expiresAt: '2099-01-01', accessType: 'PAID_SUBSCRIPTION' });
    await db.doc('activationCodes/activation_owner').set({ codes: ['PROD-TEST123', 'PROD-LEGACY123'] });
  });
  afterAll(async () => { await db.terminate(); await deleteApp(app); });
  const call = (body: any) => POST(new NextRequest('http://localhost/api/students', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }));
  const student = { name: 'Isolated test student', dob: '2010-01-01', academic: { board: 'SSC', standard: '10', subjects: ['Maths'] }, mockTestSubscribed: true, parentId: 'forged' };
  it('creates once under concurrent retries and refuses client-paid forgery', async () => {
    const body = { action: 'create', student, requestId: 'create-request-test' };
    const [a, b] = await Promise.all([call(body), call(body)]);
    expect(a.status).toBe(200); expect(b.status).toBe(200);
    const id = (await a.json()).studentId; expect((await b.json()).studentId).toBe(id);
    expect((await db.doc(`students/${id}`).get()).data()).toMatchObject({ parentId: 'activation_owner', mockTestSubscribed: false });
    expect((await call({ ...body, student: { ...student, name: 'Different' } })).status).toBe(409);
  }, 20000);
  it('consumes a code atomically, binds ownership and preserves idempotent retry', async () => {
    const a = await call({ action: 'create', student, requestId: 'activate-student-a' }), b = await call({ action: 'create', student, requestId: 'activate-student-b' });
    const aid = (await a.json()).studentId, bid = (await b.json()).studentId;
    const results = await Promise.all([call({ action: 'activate', studentId: aid, code: 'PROD-TEST123' }), call({ action: 'activate', studentId: bid, code: 'PROD-TEST123' })]);
    expect(results.map(r => r.status).sort()).toEqual([200, 409]);
    const winner = results[0].status === 200 ? aid : bid;
    expect((await db.doc(`studentEntitlements/${winner}`).get()).data()).toMatchObject({ status: 'ACTIVE', verifiedPaid: true, purchaseTransactionId: 'activation_order' });
    expect((await db.doc('activationCodes/activation_owner').get()).data()?.codes).toEqual(['PROD-LEGACY123']);
    expect((await call({ action: 'activate', studentId: winner, code: 'PROD-TEST123' })).status).toBe(200);
    handles.uid = 'activation_other';
    expect((await call({ action: 'subjects', studentId: winner, subjects: ['Science'] })).status).toBe(404);
    handles.uid = 'activation_owner';
    expect((await call({ action: 'activate', studentId: winner, code: 'PROD-LEGACY123' })).status).toBe(409);
    expect((await call({ action: 'delete', studentId: winner })).status).toBe(200);
    expect((await db.doc(`studentEntitlements/${winner}`).get()).data()?.status).toBe('REVOKED');
    expect((await call({ action: 'activate', studentId: winner, code: 'PROD-TEST123' })).status).toBe(404);
  }, 30000);
});
