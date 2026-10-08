import { NextRequest, NextResponse } from 'next/server';
import { FieldPath } from 'firebase-admin/firestore';
import { adminDb } from '@/firebase/admin-init';
import { verifyRequester, RequestAuthError } from '@/lib/server-auth';
import { validId, TestEngineError } from '@/lib/server-test-engine';

// Metadata only. Question text, choices and answer keys are never part of a catalog response.
export async function GET(request: NextRequest) {
  try {
    await verifyRequester(request);
    const cursor = request.nextUrl.searchParams.get('cursor');
    let query = adminDb.collection('testSets').orderBy(FieldPath.documentId()).limit(100);
    if (cursor) query = query.startAfter(validId(cursor));
    const snapshot = await query.get();
    const sets = snapshot.docs.map(d => { const s = d.data(); return { id: d.id, name: s.name || '', board: s.board || '', standard: s.standard || '', subject: s.subject || '' }; });
    return NextResponse.json({ sets, nextCursor: snapshot.size === 100 ? snapshot.docs.at(-1)!.id : null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof RequestAuthError || error instanceof TestEngineError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Unable to load academic catalog.' }, { status: 500 });
  }
}
