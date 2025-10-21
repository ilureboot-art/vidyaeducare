
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
    // This function creates dates, so it must only run on the client.
    if (typeof window === 'undefined') {
        return [];
    }
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const fiveDaysFromNow = new Date(today);
    fiveDaysFromNow.setDate(today.getDate() + 5);

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

const initializeScheduledTests = (): ScheduledTest[] => {
    if (typeof window === 'undefined') {
        return [];
    }
    if (scheduledTestsState !== null) {
        return scheduledTestsState;
    }

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
    scheduledTestsState = getDefaultScheduledTests();
    localStorage.setItem('scheduledTests', JSON.stringify(scheduledTestsState));
    
    return scheduledTestsState;
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
