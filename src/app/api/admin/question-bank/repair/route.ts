import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/firebase/admin-init';
import { verifyRequester, RequestAuthError } from '@/lib/server-auth';
import { validId, TestEngineError } from '@/lib/server-test-engine';
import { proposeQuestionRepair } from '@/lib/question-repair';
const digest = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex');
export async function POST(request: NextRequest) {
 try {
  const actor = await verifyRequester(request, true);
  const body = await request.json(); const id = validId(body.setId);
  if (!['preview', 'apply'].includes(body.action)) throw new TestEngineError('Choose preview or apply.');
  const ref = adminDb.collection('testSets').doc(id);
  const result = await adminDb.runTransaction(async tx => {
   const snap = await tx.get(ref);
   if (!snap.exists) throw new TestEngineError('Question set not found.', 404);
   const data = snap.data()!; const proposal = proposeQuestionRepair(data.questions);
   const version = snap.updateTime!.toDate().toISOString();
   const previewHash = digest({ id, version, source: data.questions, proposed: proposal.questions });
   if (body.action === 'apply') {
    if (body.previewHash !== previewHash) throw new TestEngineError('The source changed. Preview it again.', 409);
    if (!proposal.ready || !proposal.changed) throw new TestEngineError('Only a complete, valid formatting repair can be applied.', 409);
    const backup = adminDb.collection('questionRepairBackups').doc();
    tx.create(backup, { setId: id, sourceVersion: version, source: data, proposedQuestions: proposal.questions, actorId: actor.uid, createdAt: FieldValue.serverTimestamp(), previewHash });
    tx.update(ref, { questions: proposal.questions, lastRepairId: backup.id, updatedAt: FieldValue.serverTimestamp() });
    tx.create(adminDb.collection('adminAuditLogs').doc(), { action: 'QUESTION_FORMAT_REPAIR', actorId: actor.uid, entityId: id, backupId: backup.id, changedQuestions: proposal.changed, previewHash, timestamp: FieldValue.serverTimestamp() });
   }
   // Never return keys, source questions or translated options in this report.
   return { setId: id, version, previewHash, changedQuestions: proposal.changed, ready: proposal.ready, issues: proposal.issues, applied: body.action === 'apply' };
  });
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
 } catch (e) {
  if (e instanceof TestEngineError || e instanceof RequestAuthError) return NextResponse.json({ error: e.message }, { status: e.status });
  return NextResponse.json({ error: 'Unable to review or repair this question set.' }, { status: 500 });
 }
}
