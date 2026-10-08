import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
const enabled = process.env.RUN_PROFILE_RULES_EMULATOR === '1' && process.env.FIRESTORE_EMULATOR_HOST === '127.0.0.1:9081';
const h = vi.hoisted(() => ({ db: null as any, cookie: '11111111-1111-1111-1111-111111111111', verify: vi.fn() }));
vi.mock('@/firebase/admin-init', () => ({ get adminDb() { return h.db; }, adminAuth: { verifyIdToken: h.verify } }));
vi.mock('next/headers', () => ({ cookies: () => ({ get: () => ({ value: h.cookie }), set: (_: string, v: string) => { h.cookie = v; } }), headers: () => ({ get: () => '127.0.0.7' }) }));
import { withAiUsage } from './ai-usage';
describe.skipIf(!enabled)('persisted AI usage enforcement', () => {
  let app: ReturnType<typeof initializeApp>, db: ReturnType<typeof getFirestore>;
  const input = { userDoubt: 'Explain addition' };
  const call = (id: string, token?: string, feature: 'doubt' | 'questions' = 'doubt', generate = async () => ({ explanation: 'Answer' })) => withAiUsage(feature, input, { token, requestId: id }, generate);
  const resetThrottle = async () => { const counters = await db.collection('aiUsageCounters').get(); await Promise.all(counters.docs.map(d => d.ref.update({ lastRequestAt: 0 }))); };
  beforeAll(async () => {
    app = initializeApp({ projectId: 'demo-vidya-profile-rules' }, 'ai-usage-tests'); db = getFirestore(app); h.db = db;
    await db.doc('configs/aiUsage').set({ globalDailyRequests: 100, paidDailyRequests: 2 });
    await db.doc('users/ai_paid').set({ status: 'Active' });
    await db.doc('aiAccess/ai_paid').set({ doubtSolverExpiresAt: '2099-01-01' });
    h.verify.mockImplementation(async (token: string) => { if (token === 'revoked') throw Error('revoked'); return { uid: token, email: `${token}@example.com` }; });
  });
  afterAll(async () => { await db.terminate(); await deleteApp(app); });
  it('charges five guest trial reservations once and denies the sixth across new requests', async () => {
    for (let i = 0; i < 5; i++) { await resetThrottle(); expect(await call(`guest_request_number_${i}`)).toEqual({ explanation: 'Answer' }); }
    await resetThrottle(); await expect(call('guest_request_number_6')).rejects.toThrow('five trial');
    expect(await call('guest_request_number_0')).toEqual({ explanation: 'Answer' });
  });
  it('checks revoked login, Academic role and paid expiry; paid quota cannot be exceeded', async () => {
    await expect(call('revoked_request_id_1', 'revoked')).rejects.toThrow('sign-in');
    expect(h.verify).toHaveBeenCalledWith('revoked', true);
    await expect(call('nonacademic_request_1', 'ai_paid', 'questions')).rejects.toThrow('Academic');
    for (let i = 0; i < 2; i++) { await resetThrottle(); await call(`paid_request_number_${i}`, 'ai_paid'); }
    await resetThrottle(); await expect(call('paid_request_number_3', 'ai_paid')).rejects.toThrow('fair-use');
    await db.doc('aiAccess/ai_paid').update({ doubtSolverExpiresAt: '2020-01-01' });
    await resetThrottle(); await call('expired_request_number_1', 'ai_paid');
    const requests = await db.collection('aiUsageCounters').get();
    expect(requests.docs.filter(d => d.id.endsWith('-doubt-trial')).length).toBe(2);
  });
  it('same request under contention calls the provider once and refuses changed input reuse', async () => {
    await db.doc('users/ai_concurrent').set({ status: 'Active' });
    await db.doc('aiAccess/ai_concurrent').set({ doubtSolverExpiresAt: '2099-01-01' });
    const generate = vi.fn(async () => ({ explanation: 'One' }));
    await resetThrottle();
    const results = await Promise.allSettled([call('same_request_contention_1', 'ai_concurrent', 'doubt', generate), call('same_request_contention_1', 'ai_concurrent', 'doubt', generate)]);
    expect(results.some(r => r.status === 'fulfilled')).toBe(true); expect(generate).toHaveBeenCalledTimes(1);
    await expect(withAiUsage('doubt', { userDoubt: 'Changed' }, { token: 'ai_concurrent', requestId: 'same_request_contention_1' }, generate)).rejects.toThrow('changed');
  });
});
