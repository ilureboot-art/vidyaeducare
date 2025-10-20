
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

const getDefaultScheduledTests = (): ScheduledTest[] => [
    {
        id: "SCHED-1",
        testSetId: "SET-172234567890",
        testSetName: "Gravitation Mock Test",
        dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        board: "SSC",
        standard: "10th",
        subject: "Science"
    },
    {
        id: "SCHED-2",
        testSetId: "SET-172242000000",
        testSetName: "Elements Mock Test",
        dateTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago (for practice)
        board: "SSC",
        standard: "10th",
        subject: "Science"
    },
    {
        id: "SCHED-3",
        testSetId: "SET-172234567890", // Using Gravitation test for another standard
        testSetName: "Gravitation Mock Test",
        dateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        board: "CBSE",
        standard: "11th",
        subject: "Physics"
    }
];

let scheduledTestsState: ScheduledTest[] | null = null;

const initializeScheduledTests = (): ScheduledTest[] => {
    if (typeof window !== 'undefined') {
        const savedData = localStorage.getItem('scheduledTests');
        if (savedData) {
            try {
                return JSON.parse(savedData);
            } catch (e) {
                console.error("Failed to parse scheduledTests from localStorage", e);
            }
        }
    }
    return getDefaultScheduledTests();
};

const getScheduledTests = (): ScheduledTest[] => {
    if (scheduledTestsState === null) {
        scheduledTestsState = initializeScheduledTests();
    }
    return scheduledTestsState!;
};

const saveScheduledTests = (tests: ScheduledTest[]) => {
     if (typeof window !== 'undefined') {
        localStorage.setItem('scheduledTests', JSON.stringify(tests));
        scheduledTestsState = tests;
    }
}

export function getAllScheduledTests(): ScheduledTest[] {
    return getScheduledTests();
}

// Function to add a new scheduled test
export function addScheduledTest(test: ScheduledTest) {
    const currentTests = getScheduledTests();
    // Prevent scheduling the same test set at the exact same time
    const alreadyExists = currentTests.some(st => st.dateTime === test.dateTime && st.testSetId === test.testSetId);
    if (!alreadyExists) {
        currentTests.push(test);
        saveScheduledTests(currentTests);
    }
}

// Function to get all tests (upcoming and past) for a specific student profile
export function getAllTestsForStudent(board: string, standard: string): ScheduledTest[] {
    const currentTests = getScheduledTests();
    return currentTests
        .filter(test => test.board === board && test.standard === standard)
        .sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
}

// Function to get a specific scheduled test by ID
export function getScheduledTestById(id: string): ScheduledTest | undefined {
    const currentTests = getScheduledTests();
    return currentTests.find(test => test.id === id);
}
