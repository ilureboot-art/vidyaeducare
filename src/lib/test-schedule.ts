
export type ScheduledTest = {
    id: string;
    testSetId: string;
    testSetName: string;
    date: string; // YYYY-MM-DD
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
        date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0], // 5 days from now
        board: "CBSE",
        standard: "10th",
        subject: "Mathematics",
    },
    {
        id: "SCHED-1675209600000",
        testSetId: "SET-SSC-SCI-10-01",
        testSetName: "SSC Science Practice Set 1",
        date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0], // 5 days ago
        board: "SSC",
        standard: "10th",
        subject: "Science",
    }
];

// Function to add a new scheduled test
export function addScheduledTest(test: ScheduledTest) {
    // Prevent scheduling the same test set on the same day
    const alreadyExists = scheduledTests.some(st => st.date === test.date && st.testSetId === test.testSetId);
    if (!alreadyExists) {
        scheduledTests.push(test);
    }
}

// Function to get upcoming tests for a specific student profile
export function getUpcomingTestsForStudent(board: string, standard: string): ScheduledTest[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return scheduledTests.filter(test => 
        test.board === board &&
        test.standard === standard &&
        new Date(test.date) >= today
    ).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Function to get a specific scheduled test by ID
export function getScheduledTestById(id: string): ScheduledTest | undefined {
    return scheduledTests.find(test => test.id === id);
}
