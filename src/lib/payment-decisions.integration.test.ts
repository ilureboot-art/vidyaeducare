import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ documents: new Map<string, any>(), sequence: 0, queue: Promise.resolve(), allowed: true }));
vi.mock('@/firebase/admin-init', () => {
  const ref = (path: string): any => ({ path, id: path.split('/').pop() });
  const db = { collection: (name: string) => ({ collection: name, doc: (id?: string) => ref(`${name}/${id || `auto${++state.sequence}`}`), where: (field: string, op: string, value: unknown) => ({ collection: name, field, value }) }),
    runTransaction: async (callback: any) => {
      const previous = state.queue;
      let release!: () => void;
      state.queue = new Promise(resolve => { release = resolve; });
      await previous;
      const staged = new Map(state.documents);
      const snapshot = (path: string, data: any) => ({ id: path.split('/').pop(), exists: data !== undefined, data: () => data });
      try {
        const result = await callback({ get: async (target: any) => target.collection ? { docs: [...staged.entries()].filter(([path, data]) => path.startsWith(target.collection + '/') && (!target.field || data[target.field] === target.value)).map(([path, data]) => snapshot(path, data)) } : snapshot(target.path, staged.get(target.path)),
          set: (target: any, data: any, options: any) => staged.set(target.path, options?.merge ? { ...staged.get(target.path), ...data } : data),
          update: (target: any, data: any) => staged.set(target.path, { ...staged.get(target.path), ...data }),
          create: (target: any, data: any) => { if (staged.has(target.path)) throw new Error('Already exists'); staged.set(target.path, data); },
        });
        state.documents = staged;
        return result;
      } finally { release(); }
    },
  };
  return { adminDb: db, adminAuth: { verifyIdToken: vi.fn() } };
});
vi.mock('@/lib/server-auth', () => {
  class RequestAuthError extends Error { constructor(message: string, public status: number) { super(message); } }
  return { RequestAuthError, verifyRequester: async () => { if (!state.allowed) throw new RequestAuthError('Forbidden', 403); return { uid: 'finance1', email: 'finance@example.com', isAdmin: true }; } };
});
import { POST } from '@/app/api/admin/payments/decision/route';
const decide = (overrides: any = {}) => POST(new NextRequest('http://localhost/api/admin/payments/decision', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transactionId: 'p1', status: 'Completed', reason: 'Bank statement checked', bankVerified: true, ...overrides }) }));
beforeEach(() => { state.documents = new Map([['transactions/p1', { type: 'deposit', status: 'Pending', amount: 650, user: 'student1', referenceId: 'UTR123456' }], ['wallets/student1', { balance: 200 }]]); state.allowed = true; state.queue = Promise.resolve(); });
describe('server payment decision atomicity', () => {
  it('allows only one of two simultaneous approvals to credit a wallet', async () => {
    const responses = await Promise.all([decide(), decide()]);
    expect(responses.map(response => response.status).sort()).toEqual([200, 409]);
    expect(state.documents.get('wallets/student1').balance).toBe(850);
    expect([...state.documents.keys()].filter(key => key.startsWith('adminAuditLogs/'))).toHaveLength(1);
    const audit = [...state.documents.entries()].find(([key]) => key.startsWith('adminAuditLogs/'))![1];
    expect(audit).toMatchObject({ actorUid: 'finance1', previousStatus: 'Pending', newStatus: 'Completed', walletBefore: 200, walletAfter: 850 });
  });
  it('rejects without credit or refund and prevents later approval', async () => {
    expect((await decide({ status: 'Rejected' })).status).toBe(200);
    expect(state.documents.get('wallets/student1').balance).toBe(200);
    expect((await decide()).status).toBe(409);
  });
  it('rejects duplicate references without any financial or audit writes', async () => {
    state.documents.set('transactions/other', { type: 'deposit', status: 'Completed', referenceId: 'UTR123456' });
    expect((await decide()).status).toBe(409);
    expect(state.documents.get('wallets/student1').balance).toBe(200);
    expect(state.documents.get('transactions/p1').status).toBe('Pending');
    expect([...state.documents.keys()].some(key => key.startsWith('adminAuditLogs/'))).toBe(false);
  });
  it('rechecks withdrawal balance and rolls back insufficient requests', async () => {
    state.documents.set('transactions/p1', { type: 'withdrawal', status: 'Pending', amount: -650, user: 'student1' });
    expect((await decide({ referenceId: 'OUT123456' })).status).toBe(409);
    expect(state.documents.get('wallets/student1').balance).toBe(200);
    expect(state.documents.get('transactions/p1').status).toBe('Pending');
  });
  it('detects legacy UTR case and whitespace duplicates', async () => {
    state.documents.set('transactions/old', { type: 'deposit', status: 'Rejected', referenceId: ' utr 123456 ' });
    expect((await decide()).status).toBe(409);
    expect(state.documents.get('wallets/student1').balance).toBe(200);
  });
  it('requires bank confirmation, reason and permission', async () => {
    expect((await decide({ bankVerified: false })).status).toBe(400);
    expect((await decide({ reason: '' })).status).toBe(400);
    state.allowed = false;
    expect((await decide()).status).toBe(403);
  });
});
