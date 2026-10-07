import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(()=>({auth:vi.fn(),collection:vi.fn()}));
vi.mock('@/lib/server-auth', async importOriginal=>({...await importOriginal<typeof import('./server-auth')>(),verifyRequester:mocks.auth}));
vi.mock('@/firebase/admin-init',()=>({adminDb:{collection:mocks.collection},adminAuth:{}}));
import { RequestAuthError } from './server-auth';
import { GET } from '@/app/api/admin/payments/access-review/route';
const request=(query='')=>new NextRequest(`http://localhost/api/admin/payments/access-review${query}`);
beforeEach(()=>{vi.clearAllMocks();mocks.auth.mockResolvedValue({uid:'finance',permissions:['payments']});});
describe('legacy access review API boundaries',()=>{
  it('denies unauthorized roles before reading data',async()=>{
    mocks.auth.mockRejectedValue(new RequestAuthError('Your admin role does not permit this action.',403));
    expect((await GET(request())).status).toBe(403);expect(mocks.collection).not.toHaveBeenCalled();
  });
  it('rejects invalid cursors before reading data',async()=>{
    expect((await GET(request('?cursor=bad%2Fpath'))).status).toBe(400);expect(mocks.collection).not.toHaveBeenCalled();
  });
  it('bounds every page and omits codes and personal profile fields',async()=>{
    const query={orderBy:vi.fn(),limit:vi.fn(),where:vi.fn(),get:vi.fn()};
    query.orderBy.mockReturnValue(query);query.limit.mockReturnValue(query);query.where.mockReturnValue(query);
    query.get.mockResolvedValueOnce({size:1,docs:[{id:'parent',data:()=>({name:'Private name',email:'private@test.invalid',purchasedMockTest:true})}]}).mockResolvedValueOnce({size:51,docs:Array.from({length:51},()=>({data:()=>({mockTestSubscribed:true})}))});
    mocks.collection.mockImplementation((name:string)=>name==='activationCodes'?{doc:()=>({get:async()=>({data:()=>({codes:['PRIVATE_CODE']})})})}:query);
    const response=await GET(request());const data=await response.json();
    expect(query.limit.mock.calls).toEqual([[21],[51]]);
    expect(data.rows[0]).toMatchObject({studentCount:50,complete:false,status:'REVIEW_REQUIRED',verifiedPaid:false});
    expect(JSON.stringify(data)).not.toMatch(/PRIVATE_CODE|Private name|private@test/);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});
