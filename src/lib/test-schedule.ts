
export type ScheduledTest = {
    id: string;
    testSetId: string;
    testSetName: string;
    dateTime: string; // ISO string format to store both date and time
    board: "CBSE" | "ICSE" | "SSC";
    standard: string;
    subject: string;
};

// This acts as our shared, in-memory "database" for scheduled tests.
export let scheduledTests: ScheduledTest[] = [
    {
        id: "SCHED-1672531200000",
        testSetId: "SET-CBSE-MATH-10-01",
        testSetName: "CBSE Maths Practice Set 1",
        dateTime: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(), // 5 days from now
        board: "CBSE",
        standard: "10th",
        subject: "Mathematics",
    },
    {
        id: "SCHED-1675209600000",
        testSetId: "SET-SSC-SCI-10-01",
        testSetName: "SSC Science Practice Set 1",
        dateTime: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), // 5 days ago
        board: "SSC",
        standard: "10th",
        subject: "Science",
    }
];

// Function to add a new scheduled test
export function addScheduledTest(test: ScheduledTest) {
    // Prevent scheduling the same test set at the exact same time
    const alreadyExists = scheduledTests.some(st => st.dateTime === test.dateTime && st.testSetId === test.testSetId);
    if (!alreadyExists) {
        scheduledTests.push(test);
    }
}

// Function to get upcoming tests for a specific student profile
export function getUpcomingTestsForStudent(board: string, standard: string): ScheduledTest[] {
    const now = new Date();

    return scheduledTests.filter(test => 
        test.board === board &&
        test.standard === standard &&
        new Date(test.dateTime) >= now
    ).sort((a,b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
}

// Function to get a specific scheduled test by ID
export function getScheduledTestById(id: string): ScheduledTest | undefined {
    return scheduledTests.find(test => test.id === id);
}
