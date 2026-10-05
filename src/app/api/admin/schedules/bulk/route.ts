import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/firebase/admin-init';
import { verifyRequester, RequestAuthError } from '@/lib/server-auth';
import { validateScheduleRows } from '@/lib/bulk-test-schedule';
import type { ScheduledTest } from '@/lib/test-schedule';
import type { TestSet } from '@/lib/question-bank';
export async function POST(request: NextRequest) {
  try {
    const actor = await verifyRequester(request, true);
    const body = await request.json();
    if (body.previewId) {
      if (typeof body.previewId !== 'string' || !/^[\w-]{1,150}$/.test(body.previewId)) throw new RequestAuthError('Invalid preview.', 400);
      const previewRef = adminDb.collection('adminBulkPreviews').doc(body.previewId);
      const auditRef = adminDb.collection('adminAuditLogs').doc();
      const outcome = await adminDb.runTransaction(async tx => {
        const preview = await tx.get(previewRef);
        const data = preview.data();
        if (!data || data.actorUid !== actor.uid) throw new RequestAuthError('Preview not found.', 404);
        if (data.committed) return { affected: data.items.length, replayed: true };
        if (data.expiresAt.toMillis() < Date.now()) throw new RequestAuthError('Preview expired. Create a new preview.', 409);
        const latest = await Promise.all(data.items.map((item: any) => tx.get(adminDb.collection('scheduledTests').doc(item.id))));
        // Every read precedes every write. Commit is all-or-nothing, capped at 100 items.
        const sets = await tx.get(adminDb.collection('testSets'));
        const schedules = await tx.get(adminDb.collection('scheduledTests'));
        if (data.mode !== 'delete') {
          const drafts = validateScheduleRows(data.rows, data.mode, sets.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestSet)), schedules.docs.map(doc => ({ ...doc.data(), id: doc.id } as ScheduledTest)));
          if (drafts.some(draft => draft.errors.length)) throw new RequestAuthError('Data changed after preview. Refresh and preview again.', 409);
          data.items.forEach((item: any, index: number) => { if (drafts[index].testSet.name !== item.after.testSetName || drafts[index].testSet.standard !== item.after.standard || drafts[index].testSet.subject !== item.after.subject || drafts[index].testSet.board !== item.after.board) throw new RequestAuthError('Test set changed after preview.', 409); });
        }
        if (data.mode === 'delete') {
          for (const item of data.items) {
            const results = await tx.get(adminDb.collection('testResults').where('testId', '==', item.id).limit(1));
            const ranking = await tx.get(adminDb.collection('leaderboard').where('testId', '==', item.id).limit(1));
            if (!results.empty || !ranking.empty || new Date(item.before.dateTime).getTime() <= Date.now()) throw new RequestAuthError('A selected session started or has results. Create a new preview.', 409);
          }
        }
        data.items.forEach((item: any, index: number) => {
          const current: any = latest[index];
          if (item.version ? !current.exists || `${current.updateTime.seconds}.${current.updateTime.nanoseconds}` !== item.version : current.exists) throw new RequestAuthError('A selected session changed. Create a new preview.', 409);
        });
        data.items.forEach((item: any) => {
          const ref = adminDb.collection('scheduledTests').doc(item.id);
          if (data.mode === 'delete') tx.delete(ref);
          else tx.set(ref, { ...item.after, startsAt: Timestamp.fromDate(new Date(item.after.dateTime)), updatedAt: FieldValue.serverTimestamp(), lastModifiedBy: actor.uid }, { merge: data.mode === 'reschedule' });
        });
        tx.create(auditRef, { action: `bulk_${data.mode}`, entityId: previewRef.id, actorUid: actor.uid, actorEmail: actor.email, reason: 'Confirmed validated bulk preview', affected: data.items.length, changes: data.items, createdAt: FieldValue.serverTimestamp() });
        tx.update(previewRef, { committed: true, committedAt: FieldValue.serverTimestamp(), auditId: auditRef.id });
        return { affected: data.items.length, replayed: false };
      });
      return NextResponse.json({ success: true, ...outcome });
    }
    if (!['schedule', 'reschedule', 'delete'].includes(body.mode)) throw new RequestAuthError('Invalid bulk mode.', 400);
    const [sets, schedules] = await Promise.all([adminDb.collection('testSets').get(), adminDb.collection('scheduledTests').get()]);
    const items: any[] = [];
    const errors: string[] = [];
    if (body.mode === 'delete') {
      if (!Array.isArray(body.ids) || !body.ids.length || body.ids.length > 100 || body.ids.some((id: unknown) => typeof id !== 'string' || !/^[\w-]{1,150}$/.test(id)) || new Set(body.ids).size !== body.ids.length) throw new RequestAuthError('Select 1–100 unique sessions.', 400);
      for (const id of body.ids) {
        const snapshot = schedules.docs.find(doc => doc.id === id);
        if (!snapshot || new Date(snapshot.data().dateTime).getTime() <= Date.now()) { errors.push(`${id}: only upcoming sessions can be deleted`); continue; }
        const [results, ranking] = await Promise.all([adminDb.collection('testResults').where('testId', '==', id).limit(1).get(), adminDb.collection('leaderboard').where('testId', '==', id).limit(1).get()]);
        if (!results.empty || !ranking.empty) { errors.push(`${id}: results exist`); continue; }
        items.push({ id, before: snapshot.data(), after: null, version: `${snapshot.updateTime.seconds}.${snapshot.updateTime.nanoseconds}` });
      }
    } else {
      if (!Array.isArray(body.rows) || !body.rows.length || body.rows.length > 100 || body.rows.some((row: unknown) => !row || typeof row !== 'object' || Object.values(row).some(value => typeof value !== 'string' || value.length > 1000))) throw new RequestAuthError('Provide 1–100 CSV rows with text fields.', 400);
      const drafts = validateScheduleRows(body.rows, body.mode, sets.docs.map(doc => ({ ...doc.data(), id: doc.id } as TestSet)), schedules.docs.map(doc => ({ ...doc.data(), id: doc.id } as ScheduledTest)));
      for (const draft of drafts) {
        if (draft.errors.length) { errors.push(`Row ${draft.row}: ${draft.errors.join('; ')}`); continue; }
        const existing = draft.schedule ? schedules.docs.find(doc => doc.id === draft.schedule!.id) : null;
        const id = existing?.id || adminDb.collection('scheduledTests').doc().id;
        const set = draft.testSet;
        items.push({ id, before: existing?.data() || null, version: existing ? `${existing.updateTime.seconds}.${existing.updateTime.nanoseconds}` : null, after: { id, testSetId: set.id, testSetName: set.name, board: set.board, standard: set.standard, subject: set.subject, dateTime: draft.dateTime, duration: draft.duration, ...(!existing ? { createdAt: new Date().toISOString() } : {}) } });
      }
    }
    if (errors.length) return NextResponse.json({ errors, affected: items.length, blocked: errors.length }, { status: 400 });
    const previewRef = adminDb.collection('adminBulkPreviews').doc();
    await previewRef.create({ actorUid: actor.uid, mode: body.mode, rows: body.rows || [], items, committed: false, expiresAt: Timestamp.fromMillis(Date.now() + 10 * 60_000) });
    return NextResponse.json({ previewId: previewRef.id, affected: items.length, blocked: 0, expiresInMinutes: 10, items: items.map(item => ({ id: item.id, name: item.after?.testSetName || item.before?.testSetName, before: item.before ? { dateTime: item.before.dateTime, duration: item.before.duration } : null, after: item.after ? { dateTime: item.after.dateTime, duration: item.after.duration } : null })) });
  } catch (error) { return NextResponse.json({ error: error instanceof RequestAuthError ? error.message : 'Bulk operation failed. Refresh and preview again.' }, { status: error instanceof RequestAuthError ? error.status : 500 }); }
}
