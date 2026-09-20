import type { ScheduledTest } from './test-schedule';
import type { TestSet } from './question-bank';

export const SCHEDULE_HEADERS = ['test_set_id', 'date', 'time', 'duration_minutes'] as const;
export const RESCHEDULE_HEADERS = ['schedule_id', 'test_set_id', 'current_date', 'current_time', 'new_date', 'new_time', 'new_duration_minutes'] as const;
export const SCHEDULE_TIME_ZONE = 'Asia/Kolkata';

export type ScheduleDraft = {
  row: number;
  testSet: TestSet;
  schedule?: ScheduledTest;
  dateTime: string;
  duration: number;
  errors: string[];
};

export function istParts(date: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SCHEDULE_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: string) => parts.find(part => part.type === type)?.value || '';
  return { date: `${value('year')}-${value('month')}-${value('day')}`, time: `${value('hour')}:${value('minute')}` };
}

export function parseIstDateTime(day: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [year, month, date] = day.split('-').map(Number);
  if (year < 2000 || month < 1 || month > 12 || date < 1 || date > new Date(Date.UTC(year, month, 0)).getUTCDate()) return null;
  const parsed = new Date(`${day}T${time}:00+05:30`);
  const parts = istParts(parsed);
  return parts.date === day && parts.time === time ? parsed.toISOString() : null;
}

export function validateScheduleRows(
  rows: Record<string, string>[], mode: 'schedule' | 'reschedule',
  sets: TestSet[], schedules: ScheduledTest[], now = new Date(),
): ScheduleDraft[] {
  const seen = new Set<string>();
  return rows.map((row, index) => {
    const errors: string[] = [];
    const testSet = sets.find(item => item.id === row.test_set_id?.trim());
    const schedule = schedules.find(item => item.id === row.schedule_id?.trim());
    const identity = mode === 'schedule'
      ? `${row.test_set_id?.trim()}|${row.date?.trim()}|${row.time?.trim()}`
      : row.schedule_id?.trim();
    if (!testSet) errors.push('Unknown test_set_id');
    if (!identity || seen.has(identity)) errors.push('Duplicate or missing schedule identity');
    seen.add(identity);
    if (mode === 'reschedule') {
      if (!schedule) errors.push('Unknown schedule_id');
      else {
        if (schedule.testSetId !== row.test_set_id?.trim()) errors.push('Schedule belongs to another test set');
        if (new Date(schedule.dateTime).getTime() <= now.getTime()) errors.push('Only upcoming sessions can be rescheduled');
        const current = istParts(new Date(schedule.dateTime));
        if (current.date !== row.current_date?.trim() || current.time !== row.current_time?.trim()) errors.push('Schedule changed after CSV download; download a fresh CSV');
      }
    }
    const dateTime = parseIstDateTime(
      (mode === 'schedule' ? row.date : row.new_date)?.trim() || '',
      (mode === 'schedule' ? row.time : row.new_time)?.trim() || '',
    );
    if (!dateTime) errors.push('Invalid date/time; use YYYY-MM-DD and HH:mm (Asia/Kolkata)');
    else if (new Date(dateTime).getTime() <= now.getTime()) errors.push('Time must be in the future');
    const value = (mode === 'schedule' ? row.duration_minutes : row.new_duration_minutes)?.trim();
    const duration = Number(value);
    if (!value || !/^\d+$/.test(value) || duration < 1 || duration > 300) errors.push('Duration must be an integer from 1 to 300');
    if (mode === 'schedule' && dateTime && schedules.some(existing => existing.testSetId === testSet?.id && existing.dateTime === dateTime)) errors.push('This test set is already scheduled at this time');
    return { row: index + 2, testSet: testSet as TestSet, schedule, dateTime: dateTime || '', duration, errors };
  });
}
