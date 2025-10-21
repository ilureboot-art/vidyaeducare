
'use client';

import { getAllTestSets } from './question-bank';

export type ScheduledTest = {
    id: string;
    testSetId: string;
    testSetName: string;
    dateTime: string; // ISO string format to store both date and time
    board: "CBSE" | "ICSE" | "SSC";
    standard: string;
    subject: string;
};

let scheduledTestsState: ScheduledTest[] | null = null;

const getDefaultScheduledTests = (): ScheduledTest[] => {
    // IMPORTANT: Use static ISO strings to prevent `new Date()` from running on the server.
    // Dynamic date logic will be handled on the client side.
    return [
        {
            id: "SCHED-1",
            testSetId: "SET-172234567890",
            testSetName: "Gravitation Mock Test",
            dateTime: "2025-08-01T10:00:00.000Z", // Future date
            board: "SSC",
            standard: "10th",
            subject: "Science"
        },
        {
            id: "SCHED-2",
            testSetId: "SET-172242000000",
            testSetName: "Elements Mock Test",
            dateTime: "2024-07-01T10:00:00.000Z", // Past date
            board: "SSC",
            standard: "10th",
            subject: "Science"
        },
    ];
};

const initializeScheduledTests = (): ScheduledTest[] => {
    if (scheduledTestsState) {
        return scheduledTestsState;
    }

    if (typeof window !== 'undefined') {
        try {
            const savedData = localStorage.getItem('scheduledTests');
            if (savedData) {
                scheduledTestsState = JSON.parse(savedData);
                return scheduledTestsState!;
            }
        } catch (e) {
            console.error("Failed to parse scheduledTests from localStorage", e);
        }
        
        scheduledTestsState = getDefaultScheduledTests();
        localStorage.setItem('scheduledTests', JSON.stringify(scheduledTestsState));
        return scheduledTestsState;
    }

    return getDefaultScheduledTests();
};

export const getScheduledTestData = (): ScheduledTest[] => {
    return initializeScheduledTests();
};

const saveScheduledTests = (tests: ScheduledTest[]) => {
     if (typeof window !== 'undefined') {
        localStorage.setItem('scheduledTests', JSON.stringify(tests));
        scheduledTestsState = tests;
    }
}


// Function to add a new scheduled test
export function addScheduledTest(test: ScheduledTest) {
    const currentTests = getScheduledTestData();
    const testSets = getAllTestSets(); 
    const testSet = testSets.find(ts => ts.id === test.testSetId);
    if (!testSet) return;

    // Prevent scheduling the same test set at the exact same time
    const alreadyExists = currentTests.some(st => st.dateTime === test.dateTime && st.testSetId === test.testSetId);
    if (!alreadyExists) {
        currentTests.push(test);
        saveScheduledTests(currentTests);
    }
}

// Function to get all tests (upcoming and past) for a specific student profile
export function getAllTestsForStudent(board: string, standard: string): ScheduledTest[] {
    const currentTests = getScheduledTestData();
    return currentTests.filter(test => test.board === board && test.standard === standard);
}

// Function to get a specific scheduled test by ID
export function getScheduledTestById(id: string): ScheduledTest | undefined {
    const currentTests = getScheduledTestData();
    return currentTests.find(test => test.id === id);
}
