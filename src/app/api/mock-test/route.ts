import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/firebase/admin-init';
import { verifyRequester, RequestAuthError } from '@/lib/server-auth';
import { attemptWindow, normalizeSelections, publicQuestions, scoreSelections, TestEngineError, timeString, validId, validateQuestionSet, verifiedAccess } from '@/lib/server-test-engine';
import { getMockTestRewardEligibility } from '@/lib/mock-test-rewards';

export async function POST(request: NextRequest) {
  try {
    const { uid } = await verifyRequester(request);
    if (Number(request.headers.get('content-length') || 0) > 50000) throw new TestEngineError('Request is too large.', 413);
    const body = await request.json();
    if (!['start', 'save', 'submit', 'review'].includes(body?.action)) throw new TestEngineError('Invalid test action.');
    const studentId = validId(body.studentId), testId = validId(body.testId);
    const attemptId = createHash('sha256').update(JSON.stringify([uid, studentId, testId])).digest('hex');
    const attemptRef = adminDb.doc(`mockTestAttempts/${attemptId}`);
    const studentRef = adminDb.doc(`students/${studentId}`);
    const resultRef = adminDb.doc(`testResults/${studentId}-${testId}`);
    const response = await adminDb.runTransaction(async tx => {
      const now = new Date(), nowMs = now.getTime();
      const [studentSnap, parentSnap, attemptSnap, resultSnap] = await Promise.all([tx.get(studentRef), tx.get(adminDb.doc(`users/${uid}`)), tx.get(attemptRef), tx.get(resultRef)]);
      const student = studentSnap.data();
      if (!parentSnap.exists || ['Banned', 'Inactive'].includes(parentSnap.data()?.status) || !student || student.parentId !== uid || student.archived === true) throw new TestEngineError('Student access is unavailable.', 403);
      const existing = attemptSnap.data();
      const result = resultSnap.data();
      if (existing && existing.parentId !== uid) throw new TestEngineError('Attempt access denied.', 403);
      if (body.action === 'review') {
        if (!existing || !result || existing.status !== 'SUBMITTED') throw new TestEngineError('Submit the attempt before reviewing answers.', 409);
        if (nowMs < existing.windowEnd) throw new TestEngineError('Answer review opens after the scheduled live window closes.', 409);
        return { questions: existing.questions, result };
      }
      if (existing?.status === 'SUBMITTED') return { attemptId, status: 'SUBMITTED', result, questions: publicQuestions(existing.questions), selections: existing.selections, student: { id: studentId, name: student.name }, test: existing.test, serverNow: nowMs, deadline: existing.deadline, revision: existing.revision, live: existing.live, rewardEligibility: getMockTestRewardEligibility({ accessType: existing.accessType, test: existing.test, now }) };
      if (body.action === 'start') {
        if (existing) {
          const entitlement = (await tx.get(adminDb.doc(`studentEntitlements/${studentId}`))).data();
          const order = entitlement?.purchaseTransactionId ? (await tx.get(adminDb.doc(`transactions/${validId(entitlement.purchaseTransactionId)}`))).data() : null;
          verifiedAccess(entitlement, order, uid, existing.test, now);
        }
        if (existing) return { attemptId, status: 'ACTIVE', questions: publicQuestions(existing.questions), selections: existing.selections, student: { id: studentId, name: student.name }, test: existing.test, serverNow: nowMs, deadline: existing.deadline, revision: existing.revision, live: existing.live, rewardEligibility: getMockTestRewardEligibility({ accessType: existing.accessType, test: existing.test, now }) };
        if (result) throw new TestEngineError('This student already has a result for this test.', 409);
        const [scheduleSnap, entitlementSnap] = await Promise.all([tx.get(adminDb.doc(`scheduledTests/${testId}`)), tx.get(adminDb.doc(`studentEntitlements/${studentId}`))]);
        const schedule = scheduleSnap.data();
        if (!schedule) throw new TestEngineError('Test not found.', 404);
        if (schedule.board !== student.academic?.board || schedule.standard !== student.academic?.standard) throw new TestEngineError('This test does not match the student board and standard.', 403);
        const test = { id: testId, testSetId: validId(schedule.testSetId), testSetName: schedule.testSetName, board: schedule.board, standard: schedule.standard, subject: schedule.subject, dateTime: schedule.dateTime, duration: schedule.duration };
        const window = attemptWindow(test, nowMs);
        const entitlement = entitlementSnap.data();
        const order = entitlement?.purchaseTransactionId ? await tx.get(adminDb.doc(`transactions/${validId(entitlement.purchaseTransactionId)}`)) : null;
        const accessType = verifiedAccess(entitlement, order?.data(), uid, test, now);
        const setSnap = await tx.get(adminDb.doc(`testSets/${test.testSetId}`));
        const set = setSnap.data();
        if (!set || set.board !== test.board || set.standard !== test.standard || set.subject !== test.subject) throw new TestEngineError('Question set and schedule do not match.', 409);
        const questions = validateQuestionSet(set.questions);
        const attempt = { parentId: uid, studentId, testId, test, questions, selections: {}, revision: 0, status: 'ACTIVE', startedAt: nowMs, deadline: window.deadline, windowEnd: window.windowEnd, live: window.live, accessType };
        tx.create(attemptRef, attempt);
        return { attemptId, ...window, status: 'ACTIVE', questions: publicQuestions(questions), selections: {}, revision: 0, student: { id: studentId, name: student.name }, test, serverNow: nowMs, rewardEligibility: getMockTestRewardEligibility({ accessType, test, now }) };
      }
      if (!existing) throw new TestEngineError('Start a server attempt first.', 409);
      if (!Number.isInteger(body.revision) || body.revision !== existing.revision) throw new TestEngineError('Another save changed this attempt. Reload to resume safely.', 409);
      const expired = nowMs >= existing.deadline;
      if (body.action === 'save' && expired) throw new TestEngineError('The server deadline has passed. Submit the saved answers.', 409);
      const selections = expired ? existing.selections : normalizeSelections(body.answers, existing.questions);
      if (body.action === 'save') {
        tx.update(attemptRef, { selections, revision: existing.revision + 1, lastSavedAt: nowMs });
        return { revision: existing.revision + 1, deadline: existing.deadline, serverNow: nowMs, saved: true };
      }
      const entitlementSnap = await tx.get(adminDb.doc(`studentEntitlements/${studentId}`));
      const entitlement = entitlementSnap.data();
      const order = entitlement?.purchaseTransactionId ? await tx.get(adminDb.doc(`transactions/${validId(entitlement.purchaseTransactionId)}`)) : null;
      let accessType = existing.accessType;
      try { accessType = verifiedAccess(entitlement, order?.data(), uid, existing.test, now); }
      catch (error) { if (!(error instanceof TestEngineError)) throw error; accessType = 'PURCHASE_REQUIRED'; }
      const eligible = getMockTestRewardEligibility({ accessType, test: existing.test, now });
      const ranked = existing.live && !expired && existing.accessType === 'PAID_SUBSCRIPTION' && eligible.rankingEligible;
      const scoring = scoreSelections(existing.questions, selections);
      const seconds = Math.max(0, Math.floor((Math.min(nowMs, existing.deadline) - existing.startedAt) / 1000));
      const output = { ...scoring, parentId: uid, studentId, studentName: student.name, testId, testName: existing.test.testSetName, timeTaken: timeString(seconds), date: now.toISOString(), isLive: existing.live, accessType, testWindowStatus: eligible.testWindowStatus, rankingEligible: ranked, perTestCashPrizeEligible: ranked, monthlyCashPrizeEligible: ranked, eligibilityReason: expired ? 'SERVER_DEADLINE_PASSED' : eligible.reasonCode, subscriptionSnapshot: { isPaid: accessType === 'PAID_SUBSCRIPTION', accessType, evaluatedAt: now.toISOString() }, attemptId, scoringVersion: 1 };
      if (result) throw new TestEngineError('A result already exists for this test.', 409);
      tx.create(resultRef, output);
      if (ranked) tx.create(adminDb.doc(`leaderboard/${studentId}-${testId}`), { ...output, name: student.name, avatar: student.name.charAt(0), score: scoring.rawScore, accuracy: scoring.score, time: output.timeTaken, createdAt: output.date });
      const stats = student.stats || {}, count = Number(stats.testsTaken || 0) + 1;
      tx.update(studentRef, { 'stats.testsTaken': count, 'stats.avgScore': Math.round((Number(stats.avgScore || 0) * (count - 1) + scoring.score) / count), 'stats.performance': [...(Array.isArray(stats.performance) ? stats.performance : []), { name: output.testName, score: Math.round(scoring.score) }].slice(-10) });
      tx.update(attemptRef, { status: 'SUBMITTED', selections, revision: existing.revision + 1, submittedAt: nowMs });
      tx.create(adminDb.collection('adminAuditLogs').doc(), { action: 'MOCK_TEST_SUBMITTED', actorUid: uid, studentId, testId, attemptId, ranked, expired, createdAt: FieldValue.serverTimestamp() });
      return { status: 'SUBMITTED', result: output, revision: existing.revision + 1 };
    });
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof RequestAuthError || error instanceof TestEngineError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    console.error('Server test action failed', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Unable to sync this attempt. Retry or resume.' }, { status: 500 });
  }
}
