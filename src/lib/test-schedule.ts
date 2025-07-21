
export type ScheduledTest = {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
    board: "CBSE" | "ICSE" | "SSC";
    standard: string;
    subject: string;
    questionIds: string[]; // Array of 50 question IDs
};

// This acts as our shared, in-memory "database" for scheduled tests.
export let scheduledTests: ScheduledTest[] = [
    {
        id: "TEST-1672531200000",
        title: "Science Monthly Test #1",
        date: "2024-09-01",
        board: "CBSE",
        standard: "10th",
        subject: "Science",
        questionIds: [] // In a real scenario, this would be populated with 50 IDs
    },
    {
        id: "TEST-1675209600000",
        title: "Maths Monthly Test #1",
        date: "2024-09-15",
        board: "SSC",
        standard: "10th",
        subject: "Mathematics",
        questionIds: []
    }
];

// Function to add a new scheduled test
export function addScheduledTest(test: ScheduledTest) {
    scheduledTests.push(test);
}

// Function to get tests for a specific student profile
export function getTestsForStudent(board: string, standard: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return scheduledTests.filter(test => 
        test.board === board &&
        test.standard === standard &&
        new Date(test.date) >= today
    ).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
