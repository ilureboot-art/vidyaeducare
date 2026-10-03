import { NextRequest, NextResponse } from 'next/server';
import { FieldPath } from 'firebase-admin/firestore';
import { adminDb } from '@/firebase/admin-init';
import { verifyRequester, RequestAuthError } from '@/lib/server-auth';
import { rewardReportRow } from '@/lib/reward-eligibility-report';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    await verifyRequester(request, true);
    const cursor = request.nextUrl.searchParams.get('cursor');
    const month = request.nextUrl.searchParams.get('month');
    if (month && !/^20\d\d-(0[1-9]|1[0-2])$/.test(month)) return NextResponse.json({ error: 'Use YYYY-MM for month.' }, { status: 400 });
    let query = adminDb.collection('testResults').orderBy(FieldPath.documentId()).limit(201);
    if (cursor) { if (cursor.includes('/') || cursor.length > 1500) return NextResponse.json({ error: 'Invalid cursor.' }, { status: 400 }); query = query.startAfter(cursor); }
    const snapshot = await query.get();
    const page = snapshot.docs.slice(0, 200);
    const rows = page.map(doc => rewardReportRow(doc.id, doc.data())).filter(row => !month || row.date && Number.isFinite(new Date(row.date).getTime()) && new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit' }).format(new Date(row.date)) === month);
    return NextResponse.json({ rows, nextCursor: snapshot.size > 200 ? page[page.length - 1].id : null, scanned: page.length, eligible: rows.filter(row => row.rankingEligible).length, exceptions: rows.filter(row => row.mismatch).length, evaluatedAt: new Date().toISOString(), policy: 'Paid live attempt snapshots only; all months including June. This report does not award prizes.' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return NextResponse.json({ error: error instanceof RequestAuthError ? error.message : 'Unable to load reward report.' }, { status: error instanceof RequestAuthError ? error.status : 500 }); }
}
