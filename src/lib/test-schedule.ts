'use client';

import type { Timestamp } from 'firebase/firestore';

export type ScheduledTest = {
    id: string;
    testSetId: string;
    testSetName: string;
    dateTime: string; // ISO string format to store both date and time
    startsAt?: Timestamp; // Server-verifiable Firestore timestamp for security rules
    board: "CBSE" | "ICSE" | "SSC";
    standard: string;
    subject: string;
    duration: number; // Duration in minutes
    
    // NEW: Optional audit metadata fields (backward compatible)
    createdAt?: string;          // ISO timestamp when test was first scheduled
    updatedAt?: string;          // ISO timestamp when test was last modified
    lastModifiedBy?: string;     // Admin UID who last modified the test
};
