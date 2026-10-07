import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ verify: vi.fn(), admin: vi.fn() }));
vi.mock('@/firebase/admin-init', () => ({ adminAuth: { verifyIdToken: mocks.verify }, adminDb: { collection: () => ({ doc: () => ({ get: mocks.admin }) }) } }));
import { verifyRequester } from './server-auth';
const request = () => new NextRequest('http://localhost/api/admin/payments/reconciliation', { headers: { authorization: 'Bearer token' } });
beforeEach(() => { mocks.verify.mockReset(); mocks.admin.mockReset(); mocks.admin.mockResolvedValue({ data: () => undefined }); });
describe('server admin authentication', () => {
  it('requires a verified email for master access and checks token revocation', async () => {
    mocks.verify.mockResolvedValue({ uid: 'u', email: 'admin@vidyaeducare.com', email_verified: false });
    await expect(verifyRequester(request(), true)).rejects.toMatchObject({ status: 403 });
    expect(mocks.verify).toHaveBeenCalledWith('token', true);
    mocks.verify.mockResolvedValue({ uid: 'u', email: 'admin@vidyaeducare.com', email_verified: true });
    expect((await verifyRequester(request(), true)).permissions).toContain('payments');
  });
  it('denies revoked tokens and academic roles for financial reports', async () => {
    mocks.verify.mockRejectedValueOnce(new Error('revoked'));
    await expect(verifyRequester(request(), true)).rejects.toMatchObject({ status: 401 });
    mocks.verify.mockResolvedValue({ uid: 'u', email: 'academic@example.com' });
    mocks.admin.mockResolvedValue({ data: () => ({ role: 'Academic Admin', status: 'Active' }) });
    await expect(verifyRequester(request(), true)).rejects.toMatchObject({ status: 403 });
  });
});
