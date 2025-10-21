
'use client';

export type ScheduledTest = {
    id: string;
    testSetId: string;
    testSetName: string;
    dateTime: string; // ISO string format to store both date and time
    board: "CBSE" | "ICSE" | "SSC";
    standard: string;
    subject: string;
};

export const defaultScheduledTests: ScheduledTest[] = [
    {
        id: "SCHED-1",
        testSetId: "SET-172234567890",
        testSetName: "Gravitation Mock Test",
        dateTime: "2025-08-01T10:00:00.000Z", // Static future date
        board: "SSC",
        standard: "10th",
        subject: "Science"
    },
    {
        id: "SCHED-2",
        testSetId: "SET-172234567890", // Using same set for demo purposes
        testSetName: "Gravitation Practice",
        dateTime: "2024-07-01T10:00:00.000Z", // Static past date
        board: "SSC",
        standard: "10th",
        subject: "Science"
    },
];

    