import { NextRequest, NextResponse } from 'next/server';
import { FieldPath } from 'firebase-admin/firestore';
import { adminDb } from '@/firebase/admin-init';
import { verifyRequester, RequestAuthError } from '@/lib/server-auth';
import { validId, validateQuestionSet, TestEngineError } from '@/lib/server-test-engine';
export async function GET(request: NextRequest) {
  try {
    await verifyRequester(request, true);
    const cursor = request.nextUrl.searchParams.get('cursor');
    let query = adminDb.collection('testSets').orderBy(FieldPath.documentId()).limit(100);
    if (cursor) query = query.startAfter(validId(cursor));
    const sets = await query.get();
    const rows = sets.docs.map(d => {
      const data = d.data();
      let issue: string | null = null;
      try {
        validId(d.id);
        if (!['SSC', 'CBSE', 'ICSE'].includes(data.board) || typeof data.standard !== 'string' || typeof data.subject !== 'string') throw new TestEngineError('Invalid academic metadata.');
        validateQuestionSet(data.questions);
      } catch (error) { issue = error instanceof TestEngineError ? error.message : 'Question format requires review.'; }
      return { id: d.id, name: data.name || '', board: data.board || '', standard: data.standard || '', subject: data.subject || '', questionCount: Array.isArray(data.questions) ? data.questions.length : 0, status: issue ? 'REVIEW_REQUIRED' : 'FORMAT_READY', issue };
    });
    return NextResponse.json({ rows, nextCursor: sets.size === 100 ? sets.docs.at(-1)!.id : null, notice: 'Read-only format checks. Answer correctness still requires academic review. No question, key, entitlement or test result was changed.' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof TestEngineError || error instanceof RequestAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Unable to review question formats.' }, { status: 500 });
  }
}
