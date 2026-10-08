import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { FieldValue, Transaction } from 'firebase-admin/firestore';
import { adminDb } from '@/firebase/admin-init';
import { verifyRequester, RequestAuthError } from '@/lib/server-auth';
import { TestEngineError, validId, verifiedAccess } from '@/lib/server-test-engine';

async function preview(tx: Transaction, tournamentId: string) {
  const tournamentRef = adminDb.doc(`quizClashTournaments/${tournamentId}`);
  const [t, results, attempts, enrollments] = await Promise.all([tx.get(tournamentRef), tx.get(adminDb.collection('quizClashResults').where('tournamentId', '==', tournamentId).limit(201)), tx.get(adminDb.collection('quizClashAttempts').where('tournamentId', '==', tournamentId).limit(201)), tx.get(adminDb.collection('quizClashEnrollments').where('tournamentId', '==', tournamentId).limit(201))]);
  if (!t.exists) throw new TestEngineError('Tournament unavailable.', 404);
  if ([results.size, attempts.size, enrollments.size].some(n => n > 200)) throw new TestEngineError('Tournament exceeds safe settlement batch size.', 409);
  const tournament = t.data()!;
  const enrolledParents = new Set(enrollments.docs.map(d => d.data().parentId));
  if (Array.isArray(tournament.registeredUsers) && tournament.registeredUsers.some((uid: unknown) => typeof uid !== 'string' || !enrolledParents.has(uid))) throw new TestEngineError('Legacy registrations remain. Review and migrate their enrollment evidence before closing this tournament.', 409);
  if (!Number.isFinite(tournament.prizePool) || tournament.prizePool < 0) throw new TestEngineError('Prize pool needs financial review.', 409);
  const outstanding = attempts.docs.filter(d => d.data().status !== 'FINISHED').length;
  if (outstanding) throw new TestEngineError('Active attempts remain. Finish or resolve those attempts before closing this tournament.', 409);
  const attemptMap = new Map(attempts.docs.map(d => [d.id, d.data()]));
  const rows = await Promise.all(results.docs.map(async d => {
    const r = d.data(), a = attemptMap.get(d.id), e = enrollments.docs.find(e => e.id === d.id)?.data();
    if (!a || !e || r.scoringVersion !== 1 || a.status !== 'FINISHED' || a.parentId !== r.userId || a.studentId !== r.studentId || a.score !== r.score || a.timeTaken !== r.timeTaken) throw new TestEngineError('Legacy or inconsistent results require review; automatic payment is refused.', 409);
    const studentRef = adminDb.doc(`students/${validId(r.studentId)}`);
    const [student, entitlement] = await Promise.all([tx.get(studentRef), tx.get(adminDb.doc(`studentEntitlements/${r.studentId}`))]);
    const ent = entitlement.data();
    const order = ent?.purchaseTransactionId ? (await tx.get(adminDb.doc(`transactions/${validId(ent.purchaseTransactionId)}`))).data() : null;
    let paid = false;
    try { paid = student.data()?.parentId === r.userId && !student.data()?.archived && verifiedAccess(ent, order, r.userId, { dateTime: tournament.startTime }, new Date()) === 'PAID_SUBSCRIPTION'; } catch (error) { if (!(error instanceof TestEngineError)) throw error; }
    return { id: d.id, ref: d.ref, studentRef, userId: r.userId, studentId: r.studentId, score: r.score, timeTaken: r.timeTaken, paid, rank: 0, prize: 0 };
  }));
  rows.sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken || a.id.localeCompare(b.id));
  const ranked = tournament.type === 'Pro' ? rows.filter(r => r.paid) : rows;
  ranked.forEach((r, i) => { r.rank = i + 1; if (tournament.type === 'Pro' && i < 4) r.prize = Math.round(Math.round(tournament.prizePool * 100) * 0.8 * [0.4, 0.3, 0.2, 0.1][i]) / 100; });
  const visible = { tournamentId, title: tournament.title, status: tournament.status, alreadySettled: tournament.settlementVersion === 1, prizePool: tournament.prizePool, unstartedStudents: enrollments.size - attempts.size, rows: rows.map(({ ref, studentRef, ...r }) => r) };
  const hash = createHash('sha256').update(JSON.stringify(visible)).digest('hex');
  return { visible: { ...visible, previewHash: hash }, hash, rows, tournamentRef, tournament };
}
export async function GET(request: NextRequest) {
  try {
    await verifyRequester(request, true);
    const id = validId(request.nextUrl.searchParams.get('tournamentId'));
    return NextResponse.json(await adminDb.runTransaction(async tx => (await preview(tx, id)).visible), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  try {
    const actor = await verifyRequester(request, true), body = await request.json(), id = validId(body.tournamentId);
    if (body.action !== 'close-and-settle' || !/^[a-f0-9]{64}$/.test(body.previewHash || '')) throw new TestEngineError('Review a fresh preview before settlement.');
    const result = await adminDb.runTransaction(async tx => {
      const p = await preview(tx, id);
      if (p.tournament.settlementVersion === 1) return { settled: true, replay: true };
      if (p.hash !== body.previewHash) throw new TestEngineError('The preview changed. Review again before settlement.', 409);
      const winners = p.rows.filter(r => r.prize > 0);
      const wallets = await Promise.all(winners.map(r => tx.get(adminDb.doc(`wallets/${r.userId}`))));
      winners.forEach((r, i) => {
        const balance = wallets[i].data()?.balance;
        if (!Number.isFinite(balance) || balance < 0) throw new TestEngineError('Winner wallet requires financial review.', 409);
        tx.update(wallets[i].ref, { balance: Math.round((balance + r.prize) * 100) / 100 });
        tx.create(adminDb.doc(`transactions/quiz-prize-${r.id}`), { user: r.userId, studentId: r.studentId, tournamentId: id, amount: r.prize, type: 'Prize', status: 'Completed', date: FieldValue.serverTimestamp(), description: `Quiz Clash ${p.tournament.title} rank ${r.rank}` });
        tx.update(r.studentRef, { 'stats.totalEarnings': FieldValue.increment(r.prize) });
        tx.create(adminDb.collection('notifications').doc(), { userId: r.userId, type: 'prize', message: `Quiz Clash prize ₹${r.prize.toFixed(2)} credited.`, status: 'unread', timestamp: FieldValue.serverTimestamp(), actionUrl: '/wallet' });
      });
      p.rows.forEach(r => tx.update(r.ref, { rank: r.rank || null, prize: r.prize, paidEligible: r.paid, settlementVersion: 1 }));
      tx.update(p.tournamentRef, { status: 'completed', settlementVersion: 1, settledAt: FieldValue.serverTimestamp(), settledBy: actor.uid });
      tx.create(adminDb.collection('adminAuditLogs').doc(), { action: 'QUIZ_CLASH_SETTLED', actorUid: actor.uid, tournamentId: id, previewHash: p.hash, totalAwarded: winners.reduce<number>((n, r) => n + r.prize, 0), createdAt: FieldValue.serverTimestamp() });
      return { settled: true, replay: false };
    });
    return NextResponse.json(result);
  } catch (error) { return failure(error); }
}
function failure(error: unknown) {
  if (error instanceof TestEngineError || error instanceof RequestAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof SyntaxError) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  return NextResponse.json({ error: 'Settlement failed. No partial credit was committed.' }, { status: 500 });
}
