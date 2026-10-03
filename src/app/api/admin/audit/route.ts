import { NextRequest, NextResponse } from 'next/server';
import { FieldPath } from 'firebase-admin/firestore';
import { adminDb } from '@/firebase/admin-init';
import { verifyRequester, RequestAuthError } from '@/lib/server-auth';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    await verifyRequester(request, true);
    const cursor = request.nextUrl.searchParams.get('cursor');
    let query = adminDb.collection('adminAuditLogs').orderBy('createdAt', 'desc').orderBy(FieldPath.documentId()).limit(101);
    if (cursor) {
      if (cursor.includes('/')) throw new RequestAuthError('Invalid cursor.', 400);
      const last = await adminDb.collection('adminAuditLogs').doc(cursor).get();
      if (!last.exists) throw new RequestAuthError('Cursor expired. Refresh the report.', 400);
      query = query.startAfter(last);
    }
    const snapshot = await query.get();
    const page = snapshot.docs.slice(0, 100);
    return NextResponse.json({ rows: page.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null })), nextCursor: snapshot.size > 100 ? page[page.length - 1].id : null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return NextResponse.json({ error: error instanceof RequestAuthError ? error.message : 'Unable to load audit trail.' }, { status: error instanceof RequestAuthError ? error.status : 500 }); }
}
