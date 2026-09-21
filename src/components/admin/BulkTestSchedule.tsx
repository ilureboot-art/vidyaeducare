"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { collection, doc, runTransaction, serverTimestamp, Timestamp, writeBatch, type Firestore } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import type { TestSet } from '@/lib/question-bank';
import type { ScheduledTest } from '@/lib/test-schedule';
import { istParts, parseIstDateTime, RESCHEDULE_HEADERS, SCHEDULE_HEADERS, validateScheduleRows, type ScheduleDraft } from '@/lib/bulk-test-schedule';

type Mode = 'schedule' | 'reschedule';
type Props = { db: Firestore; uid?: string; sets: TestSet[]; schedules: ScheduledTest[]; onComplete: () => Promise<void> | void };

function downloadCsv(filename: string, records: Record<string, string>[], columns: readonly string[]) {
  const csv = '\uFEFF' + Papa.unparse({ fields: [...columns], data: records.map(record => columns.map(column => record[column] || '')) });
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function BulkTestSchedule({ db, uid, sets, schedules, onComplete }: Props) {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('schedule');
  const [selected, setSelected] = useState<string[]>([]);
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current || !sets.length) return;
    initialized.current = true;
    const ids = new URLSearchParams(window.location.search).get('testSetIds')?.split(',') || [];
    if (ids.length) setSelected(ids.filter(id => sets.some(set => set.id === id)));
  }, [sets]);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [interval, setInterval] = useState('1440');
  const [duration, setDuration] = useState('30');
  const [drafts, setDrafts] = useState<ScheduleDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const options = useMemo(() => mode === 'schedule' ? sets.map(set => ({ id: set.id, label: `${set.name} (${set.id})` })) : schedules.filter(schedule => new Date(schedule.dateTime) > new Date()).map(schedule => ({ id: schedule.id, label: `${schedule.testSetName} (${schedule.id})` })), [mode, sets, schedules]);

  const toggle = (id: string) => setSelected(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]);
  const switchMode = (next: Mode) => { setMode(next); setSelected([]); setDrafts([]); };
  const parseRows = (rows: Record<string, string>[], nextMode: Mode) => {
    const result = validateScheduleRows(rows, nextMode, sets, schedules);
    setDrafts(result);
    toast({ title: 'CSV validated', description: `${result.length} rows; ${result.filter(item => item.errors.length).length} with errors.` });
  };

  const downloadTemplate = () => {
    const rows = mode === 'schedule'
      ? (selected.length ? sets.filter(set => selected.includes(set.id)) : sets).map(set => ({
        test_set_id: set.id, test_set_name: set.name, standard: set.standard,
        subject_name: set.subject, date: '', time: '', duration_minutes: '30',
      }))
      : schedules.filter(schedule => selected.includes(schedule.id)).map(schedule => {
        const current = istParts(new Date(schedule.dateTime));
        const set = sets.find(item => item.id === schedule.testSetId);
        return {
          schedule_id: schedule.id, test_set_id: schedule.testSetId,
          test_set_name: set?.name || schedule.testSetName,
          standard: set?.standard || schedule.standard || '',
          subject_name: set?.subject || schedule.subject || '',
          current_date: current.date, current_time: current.time,
          date: '', time: '', duration_minutes: String(schedule.duration),
        };
      });
    downloadCsv(`mcq-${mode}-template.csv`, rows, mode === 'schedule' ? SCHEDULE_HEADERS : RESCHEDULE_HEADERS);
  };

  const upload = (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv') || file.size > 2_000_000) {
      toast({ variant: 'destructive', title: 'Use a CSV smaller than 2 MB' }); return;
    }
    Papa.parse<Record<string, string>>(file, {
      header: true, skipEmptyLines: 'greedy', complete: result => {
        const headers = mode === 'schedule' ? SCHEDULE_HEADERS : RESCHEDULE_HEADERS;
        const fields = (result.meta.fields || []).map(field => field.replace(/^\uFEFF/, '').trim());
        if (result.errors.length || headers.some(header => !fields.includes(header)) || result.data.length === 0) {
          setDrafts([]);
          toast({ variant: 'destructive', title: 'Invalid CSV', description: `Required columns: ${headers.join(', ')}. ${result.errors[0]?.message || ''}` }); return;
        }
        parseRows(result.data.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/^\uFEFF/, '').trim(), value]))), mode);
      }, error: error => toast({ variant: 'destructive', title: 'CSV read failed', description: error.message }),
    });
  };

  const autoSchedule = () => {
    const minutes = Number(interval);
    if (!startDate || !/^\d+$/.test(interval) || minutes < 1 || !selected.length) {
      toast({ variant: 'destructive', title: 'Select test sets, a start date and a positive interval' }); return;
    }
    const first = parseIstDateTime(startDate, startTime);
    if (!first) { toast({ variant: 'destructive', title: 'Invalid start date or time' }); return; }
    const rows = selected.map((id, index) => {
      const next = istParts(new Date(new Date(first).getTime() + index * minutes * 60_000));
      const set = sets.find(item => item.id === id)!;
      return {
        test_set_id: id, test_set_name: set.name, standard: set.standard,
        subject_name: set.subject, date: next.date, time: next.time,
        duration_minutes: duration,
      };
    });
    parseRows(rows, 'schedule');
  };

  const confirm = async () => {
    if (!drafts.length || drafts.some(item => item.errors.length) || !uid || busy) return;
    if (!window.confirm(`Confirm ${mode} for ${drafts.length} MCQ test sessions?`)) return;
    setBusy(true);
    let saved = 0;
    try {
      // Recheck the schedule version before each batch so stale downloads cannot overwrite newer edits.
      for (let offset = 0; offset < drafts.length; offset += 200) {
        const part = drafts.slice(offset, offset + 200);
        if (part.some(draft => new Date(draft.dateTime) <= new Date())) throw new Error('A proposed time has passed; upload a fresh CSV.');
        if (mode === 'reschedule') {
          await runTransaction(db, async transaction => {
            const latest = await Promise.all(part.map(draft => transaction.get(doc(db, 'scheduledTests', draft.schedule!.id))));
            latest.forEach((snapshot, index) => {
              if (!snapshot.exists() || snapshot.data().dateTime !== part[index].schedule!.dateTime || snapshot.data().duration !== part[index].schedule!.duration || new Date(snapshot.data().dateTime) <= new Date()) throw new Error(`Session ${part[index].schedule!.id} changed or started; refresh and upload again.`);
            });
            part.forEach(draft => transaction.update(doc(db, 'scheduledTests', draft.schedule!.id), {
              dateTime: draft.dateTime, startsAt: Timestamp.fromDate(new Date(draft.dateTime)), duration: draft.duration,
              updatedAt: serverTimestamp(), lastModifiedBy: uid,
            }));
          });
          saved += part.length;
          continue;
        }
        const batch = writeBatch(db);
        for (const draft of part) {
            const ref = doc(collection(db, 'scheduledTests'));
            batch.set(ref, { id: ref.id, testSetId: draft.testSet.id, testSetName: draft.testSet.name,
              board: draft.testSet.board, standard: draft.testSet.standard, subject: draft.testSet.subject,
              dateTime: draft.dateTime, startsAt: Timestamp.fromDate(new Date(draft.dateTime)), duration: draft.duration,
              createdAt: serverTimestamp(), lastModifiedBy: uid });
        }
        await batch.commit();
        saved += part.length;
      }
      toast({ title: 'Bulk operation completed', description: `${saved} sessions ${mode === 'schedule' ? 'scheduled' : 'rescheduled'}.` });
      setDrafts([]); setSelected([]); await onComplete();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Bulk operation stopped', description: `${saved} saved. ${error instanceof Error ? error.message : 'Try again.'} Refresh before retrying.` });
      await onComplete();
    } finally { setBusy(false); }
  };

  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2"><Button variant={mode === 'schedule' ? 'default' : 'outline'} onClick={() => switchMode('schedule')}>New schedules</Button><Button variant={mode === 'reschedule' ? 'default' : 'outline'} onClick={() => switchMode('reschedule')}>Reschedule existing</Button></div>
    <p className="text-sm text-muted-foreground">CSV includes Test Set ID, Test Set Name, Std, Subject Name, Date, Time and Duration. Times use Asia/Kolkata (IST), YYYY-MM-DD and 24-hour HH:mm. Select sessions for the reschedule template.</p>
    <div className="max-h-40 overflow-y-auto rounded-md border p-2 space-y-1">
      {options.map(option => <label key={option.id} className="flex items-center gap-2 text-sm p-1"><Checkbox checked={selected.includes(option.id)} onCheckedChange={() => toggle(option.id)} />{option.label}</label>)}
    </div>
    {mode === 'schedule' && <div className="grid grid-cols-2 md:grid-cols-4 gap-2"><Input aria-label="Start date" type="date" value={startDate} onChange={event => setStartDate(event.target.value)} /><Input aria-label="Start time" type="time" value={startTime} onChange={event => setStartTime(event.target.value)} /><Input aria-label="Interval minutes" type="number" min="1" value={interval} onChange={event => setInterval(event.target.value)} placeholder="Interval (minutes)" /><Input aria-label="Duration minutes" type="number" min="1" max="300" value={duration} onChange={event => setDuration(event.target.value)} placeholder="Duration (minutes)" /></div>}
    <div className="flex flex-wrap gap-2">{mode === 'schedule' && <Button variant="secondary" onClick={autoSchedule}>Bulk Auto Schedule → Preview</Button>}<Button variant="outline" onClick={downloadTemplate} disabled={mode === 'reschedule' && !selected.length}>Download CSV Template</Button><Input aria-label="Upload schedule CSV" className="max-w-xs" type="file" accept=".csv,text/csv" onChange={event => { upload(event.target.files?.[0]); event.target.value = ''; }} /></div>
    {drafts.length > 0 && <div className="space-y-2"><p className="font-medium">Preview: {drafts.length} rows, {drafts.filter(item => item.errors.length).length} errors</p><div className="max-h-60 overflow-auto border rounded-md text-sm">{drafts.map(item => <div className="border-b p-2" key={item.row}>Row {item.row}: {item.testSet?.name || 'Unknown set'} · {item.schedule?.id || 'New session'} · {item.dateTime || 'Invalid time'} · {item.duration} min {item.errors.length ? <span className="text-destructive">— {item.errors.join('; ')}</span> : null}</div>)}</div><Button disabled={busy || !uid || drafts.some(item => item.errors.length)} onClick={confirm}>{busy ? 'Saving…' : `Confirm ${mode} (${drafts.length})`}</Button></div>}
  </div>;
}
