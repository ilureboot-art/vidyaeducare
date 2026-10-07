import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/firebase/admin-init';
import { verifyRequester, RequestAuthError } from '@/lib/server-auth';
import { activationClaimId, assertActivationEvidence, normalizeStudentInput, normalizeSubjects, StudentActionError } from '@/lib/student-entitlement';

export async function POST(request: NextRequest) {
  try {
    const { uid } = await verifyRequester(request);
    const body = await request.json();
    const action = body?.action;
    if (!['create', 'verify-code', 'activate', 'subjects', 'goals', 'delete'].includes(action)) throw new StudentActionError('Invalid student action.');
    const profile = await adminDb.collection('users').doc(uid).get();
    if (!profile.exists || ['Banned', 'Inactive'].includes(profile.data()?.status)) throw new StudentActionError('An active parent account is required.', 403);
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    if ((action === 'verify-code' || action === 'activate' || code) && !/^[A-Za-z0-9-]{6,100}$/.test(code)) throw new StudentActionError('Enter a valid activation code.');
    const input = action === 'create' ? normalizeStudentInput(body.student) : null;
    if (action === 'create' && !/^[A-Za-z0-9_-]{8,100}$/.test(body.requestId || '')) throw new StudentActionError('A stable registration request identifier is required.');
    const studentId = action === 'create' ? `STU-${activationClaimId(uid, body.requestId).slice(0, 24)}` : body.studentId;
    if (action !== 'verify-code' && (typeof studentId !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(studentId))) throw new StudentActionError('Invalid student identifier.');
    const fingerprint = input ? createHash('sha256').update(JSON.stringify({ input, code })).digest('hex') : null;
    const result = await adminDb.runTransaction(async tx => {
      const studentRef = action === 'verify-code' ? null : adminDb.collection('students').doc(studentId);
      const student = studentRef ? await tx.get(studentRef) : null;
      if (action !== 'create' && action !== 'verify-code' && (!student?.exists || student.data()?.parentId !== uid || student.data()?.archived === true)) throw new StudentActionError('Student profile is unavailable.', 404);
      if (action === 'create' && student?.exists) {
        if (student.data()?.parentId !== uid || student.data()?.registrationFingerprint !== fingerprint) throw new StudentActionError('This request identifier was already used for different details.', 409);
        return { studentId, created: false };
      }
      let entitlement: ReturnType<typeof assertActivationEvidence> | null = null;
      const claimRef = code ? adminDb.collection('studentActivationClaims').doc(activationClaimId(uid, code)) : null;
      if (claimRef) {
        const claim = await tx.get(claimRef);
        const voucher = claim.data();
        const orderId = voucher?.purchaseTransactionId;
        const order = typeof orderId === 'string' && /^[A-Za-z0-9_-]{1,150}$/.test(orderId) ? await tx.get(adminDb.collection('transactions').doc(orderId)) : null;
        entitlement = assertActivationEvidence(voucher, order?.data(), uid);
        if (voucher?.status === 'USED') {
          if (action === 'activate' && voucher.studentId === studentId) return { studentId, activated: true };
          throw new StudentActionError('This activation code has already been used.', 409);
        }
        if (voucher?.status !== 'AVAILABLE') throw new StudentActionError('This activation code is unavailable.', 409);
      }
      if (action === 'verify-code') return { valid: true, expiresAt: entitlement?.expiresAt };
      const now = new Date().toISOString();
      if (action === 'create') tx.create(studentRef!, { id: studentId, parentId: uid, ...input, avatarUrl: `https://picsum.photos/seed/${studentId}/100/100`, createdAt: now, registrationFingerprint: fingerprint, mockTestSubscribed: entitlement?.verifiedPaid === true, ...(entitlement ? { mockTestEntitlement: entitlement } : {}), stats: { totalEarnings: 0, testsTaken: 0, avgScore: 0, performance: [], recentActivity: [] }, badges: [] });
      if (action === 'activate') tx.update(studentRef!, { mockTestSubscribed: entitlement?.verifiedPaid === true, mockTestEntitlement: entitlement });
      if ((action === 'create' || action === 'activate') && claimRef) {
        tx.update(claimRef, { status: 'USED', studentId, redeemedAt: FieldValue.serverTimestamp() });
        tx.set(adminDb.collection('activationCodes').doc(uid), { codes: FieldValue.arrayRemove(code) }, { merge: true });
        tx.set(adminDb.collection('studentEntitlements').doc(studentId), { parentId: uid, studentId, ...entitlement, activationClaimId: claimRef.id, updatedAt: FieldValue.serverTimestamp() });
      }
      if (action === 'subjects') tx.update(studentRef!, { 'academic.subjects': normalizeSubjects(body.subjects) });
      if (action === 'goals') {
        const g = body.goals;
        if (!g || !Number.isInteger(g.targetAccuracy) || g.targetAccuracy < 1 || g.targetAccuracy > 100 || !Number.isInteger(g.weeklyTests) || g.weeklyTests < 1 || g.weeklyTests > 30 || typeof g.focusSubject !== 'string' || g.focusSubject.length > 100) throw new StudentActionError('Invalid study goals.');
        tx.update(studentRef!, { studyGoals: { targetAccuracy: g.targetAccuracy, weeklyTests: g.weeklyTests, focusSubject: g.focusSubject.trim(), updatedAt: now } });
      }
      if (action === 'delete') {
        tx.update(studentRef!, { archived: true, archivedAt: now, mockTestSubscribed: false, 'mockTestEntitlement.status': 'REVOKED' });
        tx.set(adminDb.collection('studentEntitlements').doc(studentId), { parentId: uid, studentId, status: 'REVOKED', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      }
      tx.create(adminDb.collection('adminAuditLogs').doc(), { action: `STUDENT_${action.toUpperCase()}`, actorUid: uid, studentId, createdAt: FieldValue.serverTimestamp() });
      return { studentId, success: true };
    });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof RequestAuthError || error instanceof StudentActionError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    console.error('Student action failed', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Unable to update the student. Please retry.' }, { status: 500 });
  }
}
