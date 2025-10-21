
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

const getDefaultScheduledTests = (): ScheduledTest[] => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const fiveDaysFromNow = new Date(now);
    fiveDaysFromNow.setDate(now.getDate() + 5);

    return [
        {
            id: "SCHED-1",
            testSetId: "SET-172234567890",
            testSetName: "Gravitation Mock Test",
            dateTime: tomorrow.toISOString(),
            board: "SSC",
            standard: "10th",
            subject: "Science"
        },
        {
            id: "SCHED-2",
            testSetId: "SET-172242000000",
            testSetName: "Elements Mock Test",
            dateTime: yesterday.toISOString(),
            board: "SSC",
            standard: "10th",
            subject: "Science"
        },
        {
            id: "SCHED-3",
            testSetId: "SET-172234567890", // Using Gravitation test for another standard
            testSetName: "Gravitation Mock Test",
            dateTime: fiveDaysFromNow.toISOString(),
            board: "CBSE",
            standard: "11th",
            subject: "Physics"
        }
    ];
};

let scheduledTestsState: ScheduledTest[] | null = null;

const initializeScheduledTests = (): ScheduledTest[] => {
    // This function should only be called on the client
    const savedData = localStorage.getItem('scheduledTests');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            scheduledTestsState = parsedData;
            return parsedData;
        } catch (e) {
            console.error("Failed to parse scheduledTests from localStorage", e);
        }
    }
    const defaultData = getDefaultScheduledTests();
    scheduledTestsState = defaultData;
    localStorage.setItem('scheduledTests', JSON.stringify(scheduledTestsState));
    return scheduledTestsState;
};

export const getScheduledTestData = (): ScheduledTest[] => {
    if (typeof window === 'undefined') {
        // Return a safe default for server-side rendering
        return getDefaultScheduledTests();
    }
    if (scheduledTestsState === null) {
        return initializeScheduledTests();
    }
    return scheduledTestsState!;
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
    const testSets = getAllTestSets(); // This needs to be available client-side
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
    return currentTests
        .filter(test => test.board === board && test.standard === standard)
        .sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
}

// Function to get a specific scheduled test by ID
export function getScheduledTestById(id: string): ScheduledTest | undefined {
    const currentTests = getScheduledTestData();
    return currentTests.find(test => test.id === id);
}
