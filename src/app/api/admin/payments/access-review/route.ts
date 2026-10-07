import { NextRequest, NextResponse } from 'next/server';
import { FieldPath } from 'firebase-admin/firestore';
import { adminDb } from '@/firebase/admin-init';
import { verifyRequester, RequestAuthError } from '@/lib/server-auth';
import { legacyAccessReview } from '@/lib/legacy-access-review';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    await verifyRequester(request, true);
    const cursor = request.nextUrl.searchParams.get('cursor');
    if (cursor && (cursor.includes('/') || cursor.length > 1500)) return NextResponse.json({error:'Invalid cursor.'},{status:400});
    let query = adminDb.collection('users').orderBy(FieldPath.documentId()).limit(21);
    if (cursor) query = query.startAfter(cursor);
    const users = await query.get();
    const page = users.docs.slice(0,20);
    const rows = await Promise.all(page.map(async parent => {
      const [codes, students] = await Promise.all([
        adminDb.collection('activationCodes').doc(parent.id).get(),
        adminDb.collection('students').where('parentId','==',parent.id).limit(51).get(),
      ]);
      return { userId:parent.id, ...legacyAccessReview(parent.data(),codes.data() || {},students.docs.slice(0,50).map(s=>s.data()),students.size<=50) };
    }));
    return NextResponse.json({rows,nextCursor:users.size>20?page[page.length-1].id:null,evaluatedAt:new Date().toISOString(),scope:'Legacy access inventory only. No payment is verified and no entitlement or account is changed. Review paid orders and code provenance before migration.'},{headers:{'Cache-Control':'no-store'}});
  } catch (error) {
    return NextResponse.json({error:error instanceof RequestAuthError?error.message:'Unable to load access review.'},{status:error instanceof RequestAuthError?error.status:500});
  }
}
