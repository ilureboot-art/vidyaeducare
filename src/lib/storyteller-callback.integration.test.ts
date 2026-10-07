import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({ documents: new Map<string, any>(), queue: Promise.resolve(), writes: 0, sequence: 0, replay: false }));
vi.mock('firebase-admin/firestore', () => ({ FieldValue: {
  serverTimestamp: () => 'timestamp', increment: (value: number) => ({ increment: value }),
} }));
vi.mock('@/lib/storyteller-renderer', () => ({ dispatchStorytellerRenderer: vi.fn() }));
vi.mock('@/firebase/admin-init', () => ({ adminDb: {
  collection: (name: string) => ({ doc: (id?: string) => ({ path: `${name}/${id || ++state.sequence}`, id }) }),
  runTransaction: async (callback: any) => {
    const previous = state.queue;
    let release!: () => void;
    state.queue = new Promise(resolve => { release = resolve; });
    await previous;
    try {
      const run = async (commit: boolean) => {
        const staged = new Map(state.documents);
        let writes = 0;
        const write = (ref: any, values: any, merge = true) => {
          const data = merge ? { ...staged.get(ref.path) } : {};
          for (const [key, value] of Object.entries(values)) {
            data[key] = value && typeof value === 'object' && 'increment' in value
              ? Number(data[key] || 0) + Number(value.increment) : value;
          }
          staged.set(ref.path, data); writes++;
        };
        const result = await callback({
          get: async (ref: any) => ({ exists: staged.has(ref.path), data: () => staged.get(ref.path) }),
          set: (ref: any, data: any, options: any) => write(ref, data, options?.merge),
          update: (ref: any, data: any) => write(ref, data),
          create: (ref: any, data: any) => { if (staged.has(ref.path)) throw new Error('Duplicate'); write(ref, data, false); },
        });
        if (commit) { state.documents = staged; state.writes += writes; }
        return result;
      };
      if (state.replay) {
        await run(false);
        state.documents.set('storytellerProjects/p1', { ...state.documents.get('storytellerProjects/p1'), generationStatus: 'READY' });
        state.documents.set('storytellerJobs/p1', { ...state.documents.get('storytellerJobs/p1'), status: 'READY' });
      }
      return await run(true);
    } finally { release(); }
  },
} }));

import { POST } from '@/app/api/storyteller/renderer-callback/route';
import { dispatchStorytellerRenderer } from '@/lib/storyteller-renderer';
const call = (body: any, secret = 'test-secret') => POST(new NextRequest('http://localhost/api/storyteller/renderer-callback', {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-storyteller-secret': secret },
  body: typeof body === 'string' ? body : JSON.stringify({ projectId: 'p1', ...body }),
}));
beforeEach(() => {
  process.env.STORYTELLER_RENDERER_SECRET = 'test-secret';
  state.documents = new Map([
    ['storytellerProjects/p1', { paymentStatus: 'PAID', generationStatus: 'GENERATING', userId: 'u1', orderId: 'o1', amountPaid: 25 }],
    ['storytellerJobs/p1', { status: 'GENERATING', attemptCount: 0, maxRetries: 0 }],
    ['storytellerOrders/o1', { paymentStatus: 'PAID', amountPaid: 25, revenueRecipientUid: 'admin' }],
    ['wallets/u1', { balance: 100 }], ['wallets/admin', { balance: 200 }],
  ]);
  state.queue = Promise.resolve(); state.writes = 0; state.sequence = 0; state.replay = false;
  vi.mocked(dispatchStorytellerRenderer).mockClear();
});

describe('renderer callback terminal outcomes', () => {
  it('counts simultaneous READY deliveries once and preserves the first asset', async () => {
    const results = await Promise.all([call({ status: 'READY', finalAssetPath: 'first.mp3', estimatedVoiceCost: 2 }), call({ status: 'READY', finalAssetPath: 'second.mp3', estimatedVoiceCost: 2 })]);
    expect(results.map(r => r.status)).toEqual([200, 200]);
    expect(state.documents.get('storytellerProjects/p1').finalAssetPath).toBe('first.mp3');
    expect(state.documents.get('storytellerAnalytics/totals')).toMatchObject({ paidReelsGenerated: 1, estimatedVoiceCost: 2 });
  });
  it('does not refund or regress a READY reel on late failure/progress', async () => {
    await call({ status: 'READY', finalAssetPath: 'reel.mp3' });
    const writes = state.writes;
    await call({ status: 'FAILED' }); await call({ status: 'GENERATING' });
    expect(state.writes).toBe(writes);
    expect(state.documents.get('wallets/u1').balance).toBe(100);
    expect(dispatchStorytellerRenderer).not.toHaveBeenCalled();
  });
  it('refunds only once and ignores late READY after refund', async () => {
    await call({ status: 'FAILED' });
    const writes = state.writes;
    await call({ status: 'FAILED' }); await call({ status: 'READY', finalAssetPath: 'late.mp3' });
    expect(state.writes).toBe(writes);
    expect(state.documents.get('wallets/u1').balance).toBe(125);
    expect(state.documents.get('wallets/admin').balance).toBe(175);
    expect(state.documents.get('storytellerAnalytics/totals').refunds).toBe(1);
  });
  it('does not dispatch a retry from an aborted transaction attempt', async () => {
    state.documents.set('storytellerJobs/p1', { status: 'GENERATING', maxRetries: 2 });
    state.replay = true;
    await call({ status: 'FAILED' });
    expect(dispatchStorytellerRenderer).not.toHaveBeenCalled();
    expect(state.writes).toBe(0);
  });
  it('rejects malformed, missing-asset and negative-cost callbacks before writes', async () => {
    for (const body of ['{', null, { status: 'READY' }, { status: 'READY', finalAssetPath: 'x', estimatedVoiceCost: -1 }, { projectId: 'a/b', status: 'FAILED' }]) {
      expect((await call(body)).status).toBe(400);
    }
    expect(state.writes).toBe(0);
    expect((await call({ status: 'FAILED' }, 'wrong')).status).toBe(401);
  });
});
