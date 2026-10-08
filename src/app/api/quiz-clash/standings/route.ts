import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/firebase/admin-init';
import { verifyRequester, RequestAuthError } from '@/lib/server-auth';
import { validId, TestEngineError } from '@/lib/server-test-engine';
export async function GET(request: NextRequest) {
  try {
    await verifyRequester(request);
    const id = validId(request.nextUrl.searchParams.get('tournamentId'));
    const [t, results] = await Promise.all([adminDb.doc(`quizClashTournaments/${id}`).get(), adminDb.collection('quizClashResults').where('tournamentId', '==', id).limit(201).get()]);
    if (!t.exists) throw new TestEngineError('Tournament unavailable.', 404);
    if (results.size > 200) throw new TestEngineError('This large tournament requires paginated reporting.', 409);
    const tournament = t.data()!;
    const rows = results.docs.map(d => d.data()).sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken || String(a.userId).localeCompare(String(b.userId)));
    const final = tournament.settlementVersion === 1;
    return NextResponse.json({ tournament: { id, title: tournament.title, type: tournament.type }, final, results: rows.map((r, i) => ({ userId: r.userId, studentId: r.studentId, score: r.score, timeTaken: r.timeTaken, rank: final ? r.rank : i + 1, prize: final ? r.prize || 0 : 0, userName: `Participant ${i + 1}` })) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof TestEngineError || error instanceof RequestAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Unable to load standings.' }, { status: 500 });
  }
}
