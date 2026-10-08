import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/firebase/admin-init';
import { verifyRequester, RequestAuthError } from '@/lib/server-auth';
import { publicQuestions, TestEngineError, validId, validateQuestionSet, verifiedAccess } from '@/lib/server-test-engine';

export async function POST(request: NextRequest) {
  try {
    const { uid } = await verifyRequester(request);
    const body = await request.json();
    if (!['join', 'start', 'answer', 'lifeline', 'quit', 'timeout'].includes(body?.action)) throw new TestEngineError('Invalid quiz action.');
    const tournamentId = validId(body.tournamentId), studentId = validId(body.studentId);
    const key = createHash('sha256').update(JSON.stringify([uid, tournamentId])).digest('hex');
    const attemptRef = adminDb.doc(`quizClashAttempts/${key}`), enrollmentRef = adminDb.doc(`quizClashEnrollments/${key}`);
    const output = await adminDb.runTransaction(async tx => {
      const now = Date.now();
      const [parentSnap, studentSnap, tournamentSnap, enrollmentSnap, attemptSnap] = await Promise.all([tx.get(adminDb.doc(`users/${uid}`)), tx.get(adminDb.doc(`students/${studentId}`)), tx.get(adminDb.doc(`quizClashTournaments/${tournamentId}`)), tx.get(enrollmentRef), tx.get(attemptRef)]);
      const student = studentSnap.data(), tournament = tournamentSnap.data(), enrollment = enrollmentSnap.data(), attempt = attemptSnap.data();
      if (!parentSnap.exists || ['Banned', 'Inactive'].includes(parentSnap.data()?.status) || !student || student.parentId !== uid || student.archived) throw new TestEngineError('Student access denied.', 403);
      if (!tournament || !Number.isFinite(Date.parse(tournament.startTime))) throw new TestEngineError('Tournament unavailable.', 404);
      if (enrollment && enrollment.studentId !== studentId) throw new TestEngineError('This parent already enrolled another student in this tournament.', 409);
      if (body.action === 'join') {
        if (enrollment) return { joined: true };
        if (tournament.status === 'completed') throw new TestEngineError('Tournament registration has closed.', 409);
        const alreadyRegistered = Array.isArray(tournament.registeredUsers) && tournament.registeredUsers.includes(uid);
        const fee = tournament.type === 'Pro' && !alreadyRegistered ? Number(tournament.entryFee) : 0;
        if (!Number.isFinite(fee) || fee < 0 || fee > 100000 || Math.abs(Math.round(fee * 100) - fee * 100) > 0.00001) throw new TestEngineError('Tournament pricing needs review.', 409);
        if (tournament.type === 'Pro') {
          const entitlement = (await tx.get(adminDb.doc(`studentEntitlements/${studentId}`))).data();
          const order = entitlement?.purchaseTransactionId ? (await tx.get(adminDb.doc(`transactions/${validId(entitlement.purchaseTransactionId)}`))).data() : null;
          if (verifiedAccess(entitlement, order, uid, { dateTime: tournament.startTime }, new Date(now)) !== 'PAID_SUBSCRIPTION') throw new TestEngineError('Pro tournaments require verified paid student access.', 403);
        }
        const walletRef = adminDb.doc(`wallets/${uid}`);
        const wallet = fee ? (await tx.get(walletRef)).data() : null;
        if (fee && (!wallet || !Number.isFinite(wallet.balance) || wallet.balance < fee)) throw new TestEngineError('Insufficient available wallet balance.', 409);
        // A parent has one enrollment per tournament. Retries cannot debit twice.
        if (fee) {
          tx.update(walletRef, { balance: Math.round((wallet!.balance - fee) * 100) / 100 });
          tx.create(adminDb.doc(`transactions/quiz-${key}`), { user: uid, amount: -fee, finalPrice: fee, description: `Entry Fee for Quiz Clash: ${tournament.title}`, type: 'Purchase', status: 'Completed', date: FieldValue.serverTimestamp(), tournamentId, studentId });
        }
        tx.create(enrollmentRef, { parentId: uid, studentId, tournamentId, joinedAt: now, chargedFee: fee, legacyRegistration: alreadyRegistered });
        tx.update(tournamentSnap.ref, { registeredUsers: FieldValue.arrayUnion(uid), prizePool: FieldValue.increment(fee) });
        return { joined: true };
      }
      if (!enrollment || enrollment.parentId !== uid) throw new TestEngineError('Register this student before playing.', 403);
      if (attempt && (attempt.parentId !== uid || attempt.studentId !== studentId)) throw new TestEngineError('Quiz attempt denied.', 403);
      const view = (a: any) => ({ status: a.status, tournament: { id: tournamentId, title: tournament.title, registeredUsers: tournament.registeredUsers || [] }, question: a.status === 'ACTIVE' ? publicQuestions([a.questions[a.index]])[0] : null, questionNumber: a.index + 1, questionCount: a.targetCount, revision: a.revision, deadline: a.deadline, serverNow: now, score: a.score, usedLifelines: a.usedLifelines, hiddenIndices: a.hiddenIndices || [] });
      if (attempt?.status === 'FINISHED') return view(attempt);
      if (body.action === 'start') {
        if (tournament.type === 'Pro') {
          const entitlement = (await tx.get(adminDb.doc(`studentEntitlements/${studentId}`))).data();
          const order = entitlement?.purchaseTransactionId ? (await tx.get(adminDb.doc(`transactions/${validId(entitlement.purchaseTransactionId)}`))).data() : null;
          if (verifiedAccess(entitlement, order, uid, { dateTime: tournament.startTime }, new Date(now)) !== 'PAID_SUBSCRIPTION') throw new TestEngineError('Pro tournaments require an active verified subscription.', 403);
        }
        if (attempt) return view(attempt);
        if (now < Date.parse(tournament.startTime) || tournament.status === 'completed') throw new TestEngineError('The tournament is not live.', 409);
        if (!Number.isInteger(tournament.questionCount) || tournament.questionCount < 1 || tournament.questionCount > 200) throw new TestEngineError('Tournament questions need review.', 409);
        const set = (await tx.get(adminDb.doc(`testSets/${validId(tournament.testSetId)}`))).data();
        if (!set || set.board !== student.academic?.board || set.standard !== student.academic?.standard) throw new TestEngineError('Tournament questions do not match this student.', 403);
        const questions = validateQuestionSet(set.questions);
        if (questions.length < tournament.questionCount) throw new TestEngineError('Tournament does not have enough questions.', 409);
        const state = { parentId: uid, studentId, tournamentId, questions, targetCount: tournament.questionCount, index: 0, answeredCount: 0, score: 0, revision: 0, usedLifelines: [], hiddenIndices: [], status: 'ACTIVE', startedAt: now, deadline: now + 30000 };
        tx.create(attemptRef, state);
        return view(state);
      }
      if (!attempt) throw new TestEngineError('Start the server quiz first.', 409);
      if (body.revision !== attempt.revision || body.questionId !== attempt.questions[attempt.index].id) throw new TestEngineError('This question has already changed. Reload to resume.', 409);
      const state: any = { ...attempt, revision: attempt.revision + 1 };
      const question = state.questions[state.index];
      let feedback: { questionId: string; correct: boolean } | null = null;
      if (body.action === 'lifeline' && now < state.deadline) {
        if (!['fiftyFifty', 'switchQuestion', 'aiHint'].includes(body.lifeline) || state.usedLifelines.includes(body.lifeline)) throw new TestEngineError('This lifeline is unavailable.', 409);
        state.usedLifelines = [...state.usedLifelines, body.lifeline];
        if (body.lifeline === 'fiftyFifty') state.hiddenIndices = question.options.en.map((_: string, i: number) => i).filter((i: number) => question.options.en[i] !== question.correctAnswer.en).slice(0, Math.min(2, question.options.en.length - 2));
        if (body.lifeline === 'switchQuestion') {
          if (state.index + 1 >= state.questions.length || state.questions.length - state.index - 1 < state.targetCount - state.answeredCount) throw new TestEngineError('No spare question is available.', 409);
          state.index += 1; state.hiddenIndices = [];
          // Switching never extends the current question deadline.
        }
      } else if (body.action === 'answer' && now < state.deadline) {
        if (!Number.isInteger(body.optionIndex) || body.optionIndex < 0 || body.optionIndex >= question.options.en.length || state.hiddenIndices.includes(body.optionIndex)) throw new TestEngineError('Invalid option.');
        const correct = question.options.en[body.optionIndex] === question.correctAnswer.en;
        feedback = { questionId: question.id, correct };
        if (correct) state.score += 1;
        state.answeredCount += 1;
        if (!correct || state.answeredCount >= state.targetCount) state.status = 'FINISHED';
        else { state.index += 1; state.deadline = now + 30000; state.hiddenIndices = []; }
      } else if (body.action === 'quit' || now >= state.deadline) state.status = 'FINISHED';
      else throw new TestEngineError('The server question timer is still running.', 409);
      if (state.status === 'FINISHED') {
        state.finishedAt = now;
        state.timeTaken = Math.max(0, Math.floor((Math.min(now, state.deadline) - state.startedAt) / 1000));
        tx.create(adminDb.doc(`quizClashResults/${key}`), { tournamentId, userId: uid, studentId, score: state.score, timeTaken: state.timeTaken, timestamp: FieldValue.serverTimestamp(), scoringVersion: 1 });
      }
      tx.set(attemptRef, state);
      return { ...view(state), feedback };
    });
    return NextResponse.json(output, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof TestEngineError || error instanceof RequestAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    console.error('Quiz action failed', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Unable to sync quiz. Please retry.' }, { status: 500 });
  }
}
