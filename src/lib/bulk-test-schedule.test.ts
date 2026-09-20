import { describe, expect, it } from 'vitest';
import { istParts, parseIstDateTime, validateScheduleRows } from './bulk-test-schedule';
import type { TestSet } from './question-bank';
import type { ScheduledTest } from './test-schedule';

const sets = [{ id: 'set-a', name: 'Science', board: 'SSC', standard: '10', subject: 'Science', questions: [] }] as TestSet[];
const schedules = [{ id: 'session-1', testSetId: 'set-a', testSetName: 'Science', dateTime: '2030-03-01T04:30:00.000Z', duration: 30 }] as ScheduledTest[];
const now = new Date('2029-01-01T00:00:00Z');

describe('bulk MCQ schedule validation', () => {
  it('parses and formats India times at midnight boundaries', () => {
    expect(parseIstDateTime('2030-03-01', '00:15')).toBe('2030-02-28T18:45:00.000Z');
    expect(istParts(new Date('2030-02-28T18:45:00.000Z'))).toEqual({ date: '2030-03-01', time: '00:15' });
    expect(parseIstDateTime('2030-02-30', '10:00')).toBeNull();
  });

  it('accepts an existing test set without uploading questions', () => {
    const rows = validateScheduleRows([{ test_set_id: 'set-a', date: '2030-03-02', time: '10:00', duration_minutes: '30' }], 'schedule', sets, schedules, now);
    expect(rows[0].errors).toEqual([]);
    expect(rows[0].dateTime).toBe('2030-03-02T04:30:00.000Z');
  });

  it('rejects duplicate, unknown, expired, and invalid rows', () => {
    const rows = validateScheduleRows([
      { test_set_id: 'set-a', date: '2030-03-02', time: '10:00', duration_minutes: '30' },
      { test_set_id: 'set-a', date: '2030-03-02', time: '10:00', duration_minutes: '0' },
      { test_set_id: 'missing', date: '2020-01-01', time: '10:00', duration_minutes: '301' },
    ], 'schedule', sets, schedules, now);
    expect(rows[1].errors).toContain('Duplicate or missing schedule identity');
    expect(rows[1].errors).toContain('Duration must be an integer from 1 to 300');
    expect(rows[2].errors).toContain('Unknown test_set_id');
    expect(rows[2].errors).toContain('Time must be in the future');
  });

  it('matches a particular session and rejects stale reschedule exports', () => {
    const row = { schedule_id: 'session-1', test_set_id: 'set-a', current_date: '2030-03-01', current_time: '10:00', new_date: '2030-03-03', new_time: '09:30', new_duration_minutes: '45' };
    expect(validateScheduleRows([row], 'reschedule', sets, schedules, now)[0].errors).toEqual([]);
    expect(validateScheduleRows([{ ...row, current_time: '11:00' }], 'reschedule', sets, schedules, now)[0].errors).toContain('Schedule changed after CSV download; download a fresh CSV');
  });
});
