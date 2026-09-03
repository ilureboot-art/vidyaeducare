'use client';

import { type ScheduledTest } from './test-schedule';
import { addMinutes, isAfter, isBefore } from 'date-fns';

/**
 * Validates if a scheduled test edit is valid
 * Prevents scheduling in the past and validates duration constraints
 */
export function validateScheduleEdit(
    newDateTime: Date,
    duration: number
): { valid: boolean; error?: string } {
    const now = new Date();
    
    // Cannot schedule tests in the past
    if (isBefore(newDateTime, now)) {
        return { 
            valid: false, 
            error: "Cannot schedule tests in the past. Please select a future date and time." 
        };
    }
    
    // Duration must be within reasonable bounds
    if (!duration || duration < 1) {
        return { 
            valid: false, 
            error: "Duration must be at least 1 minute." 
        };
    }
    
    if (duration > 300) {
        return { 
            valid: false, 
            error: "Duration cannot exceed 300 minutes (5 hours)." 
        };
    }
    
    return { valid: true };
}

/**
 * Calculates the current status of a scheduled test
 * Returns: 'Upcoming' | 'Live' | 'Practice Only'
 */
export function calculateTestStatus(
    test: ScheduledTest,
    now: Date = new Date()
): 'Upcoming' | 'Live' | 'Practice Only' {
    const testDate = new Date(test.dateTime);
    const durationMins = test.duration || 30;
    const expiryDate = addMinutes(testDate, durationMins);
    
    // Test has ended - available for practice
    if (isAfter(now, expiryDate)) {
        return 'Practice Only';
    }
    
    // Test is currently live
    if (isAfter(now, testDate)) {
        return 'Live';
    }
    
    // Test hasn't started yet
    return 'Upcoming';
}

/**
 * Formats a scheduled test's date and time for display
 */
export function formatScheduleDateTime(dateTime: string): string {
    try {
        const date = new Date(dateTime);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    } catch (e) {
        return dateTime;
    }
}

/**
 * Calculates test duration string for display
 */
export function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Parses time string (HH:MM) and returns hours and minutes
 */
export function parseTimeString(timeString: string): { hours: number; minutes: number } | null {
    try {
        const [hours, minutes] = timeString.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) {
            return null;
        }
        return { hours, minutes };
    } catch (e) {
        return null;
    }
}

/**
 * Combines a date and time string into a Date object
 */
export function combineDateAndTime(date: Date, timeString: string): Date | null {
    const parsed = parseTimeString(timeString);
    if (!parsed) return null;
    
    const combined = new Date(date);
    combined.setHours(parsed.hours, parsed.minutes, 0, 0);
    return combined;
}

/**
 * Extracts time string (HH:MM) from a Date object
 */
export function extractTimeString(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}
