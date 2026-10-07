import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
const emulatorEnabled = process.env.RUN_WALLET_EMULATOR === '1' && process.env.FIRESTORE_EMULATOR_HOST === '127.0.0.1:9080';
const handles = vi.hoisted(() => ({ db: null as any }));
vi.mock('@/firebase/admin-init', () => ({
  get adminDb() { return handles.db; },
  adminAuth: { verifyIdToken: async () => ({ uid: 'wallet_emulator_user' }) },
}));
vi.mock('@/lib/server-auth', () => {
  class RequestAuthError extends Error { constructor(message: string, public status: number) { super(message); } }
  return { RequestAuthError, verifyRequester: async () => ({ uid: 'finance_test', email: 'finance@test.invalid' }) };
});
import { POST as withdraw } from '@/app/api/wallet/withdraw/route';
import { POST as decide } from '@/app/api/admin/payments/decision/route';
describe.skipIf(!emulatorEnabled)('isolated Firestore withdrawal transactions', () => {
  const app = initializeApp({ projectId: 'demo-vidya-wallet' }, 'wallet-reservation-tests');
  const db = getFirestore(app);
  beforeAll(async () => {
    if (!emulatorEnabled) throw new Error('Isolated emulator required');
    handles.db = db;
    for (const collection of ['wallets', 'transactions', 'notifications', 'paymentUtrClaims', 'adminAuditLogs']) await db.recursiveDelete(db.collection(collection));
    await db.collection('wallets').doc('wallet_emulator_user').set({ balance: 1500 });
  });
  afterAll(async () => { await db.terminate(); await deleteApp(app); });
  const request = (id: string) => withdraw(new NextRequest('http://localhost/api/wallet/withdraw', { method: 'POST', headers: { authorization: 'Bearer test', 'content-type': 'application/json' }, body: JSON.stringify({ amount: 650, upiId: 'test@bank', requestId: id }) }));
  const decision = (transactionId: string, status: string) => decide(new NextRequest('http://localhost/api/admin/payments/decision', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ transactionId, status, reason: 'Isolated test only', bankVerified: true, referenceId: 'EMULATOR123456' }) }));
  it('reserves once under contention, releases once, and settles without double debit', async () => {
    const [first, second] = await Promise.all([request('emulatorrequest12345'), request('emulatorrequest12345')]);
    expect(first.status).toBe(200); expect(second.status).toBe(200);
    const { transactionId } = await first.json();
    expect((await db.collection('wallets').doc('wallet_emulator_user').get()).data()).toMatchObject({ balance: 850, reservedBalance: 650 });
    expect((await decision(transactionId, 'Rejected')).status).toBe(200);
    expect((await decision(transactionId, 'Rejected')).status).toBe(409);
    expect((await db.collection('wallets').doc('wallet_emulator_user').get()).data()).toMatchObject({ balance: 1500, reservedBalance: 0 });
    const next = await request('emulatorrequest67890');
    const nextId = (await next.json()).transactionId;
    expect((await decision(nextId, 'Completed')).status).toBe(200);
    expect((await db.collection('wallets').doc('wallet_emulator_user').get()).data()).toMatchObject({ balance: 850, reservedBalance: 0 });
  }, 30000);
});
