import { describe, expect, it, vi } from 'vitest';
import {
  calculateTestStatus,
  combineDateAndTime,
  parseTimeString,
  validateScheduleEdit,
} from './test-schedule-utils';
import type { ScheduledTest } from './test-schedule';

const testAt = (dateTime: string, duration = 30): ScheduledTest => ({
  id: 'schedule-1',
  testSetId: 'set-1',
  testSetName: 'Science MCQ',
  dateTime,
  board: 'SSC',
  standard: '10',
  subject: 'Science',
  duration,
});

describe('schedule input validation', () => {
  it.each(['00:00', '09:05', '23:59'])('accepts valid time %s', (value) => {
    expect(parseTimeString(value)).not.toBeNull();
  });

  it.each(['24:00', '12:60', '9:00', 'abc', ''])('rejects invalid time %s', (value) => {
    expect(parseTimeString(value)).toBeNull();
  });

  it('combines the selected local date and time', () => {
    const combined = combineDateAndTime(new Date(2030, 0, 2), '14:45');
    expect(combined?.getFullYear()).toBe(2030);
    expect(combined?.getMonth()).toBe(0);
    expect(combined?.getDate()).toBe(2);
    expect(combined?.getHours()).toBe(14);
    expect(combined?.getMinutes()).toBe(45);
  });

  it.each([0, 1.5, 301, Number.NaN])('rejects invalid duration %s', (duration) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-01T00:00:00.000Z'));
    expect(validateScheduleEdit(new Date('2030-01-02T00:00:00.000Z'), duration).valid).toBe(false);
    vi.useRealTimers();
  });

  it('accepts duration boundaries and rejects a past schedule', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-01T12:00:00.000Z'));
    expect(validateScheduleEdit(new Date('2030-01-01T12:01:00.000Z'), 1).valid).toBe(true);
    expect(validateScheduleEdit(new Date('2030-01-01T12:01:00.000Z'), 300).valid).toBe(true);
    expect(validateScheduleEdit(new Date('2030-01-01T11:59:00.000Z'), 30).valid).toBe(false);
    vi.useRealTimers();
  });
});

describe('scheduled test status boundaries', () => {
  const scheduledTest = testAt('2030-01-01T10:00:00.000Z', 30);

  it('is upcoming before start', () => {
    expect(calculateTestStatus(scheduledTest, new Date('2030-01-01T09:59:59.999Z'))).toBe('Upcoming');
  });

  it('is live at start and before expiry', () => {
    expect(calculateTestStatus(scheduledTest, new Date('2030-01-01T10:00:00.000Z'))).toBe('Live');
    expect(calculateTestStatus(scheduledTest, new Date('2030-01-01T10:29:59.999Z'))).toBe('Live');
  });

  it('is practice-only at expiry', () => {
    expect(calculateTestStatus(scheduledTest, new Date('2030-01-01T10:30:00.000Z'))).toBe('Practice Only');
  });
});
