
export type StudentProfile = {
  id: string;
  name: string;
  dob: string;
  avatarUrl: string;
  academic: {
      standard: string;
      board: string;
      stream: string;
      language: string;
      academicYear: string;
      subjects: string[];
  },
  stats: {
    totalEarnings: number;
    testsTaken: number;
    avgScore: number;
  },
  badges: ('Platinum' | 'Gold' | 'Silver' | 'Bronze')[];
};

// This object acts as our in-memory, shared "database" for student profiles.
export const studentData: StudentProfile[] = [
    {
        id: "STU-D7F6E5C",
        name: "Anjali Singh",
        dob: "2008-05-15",
        avatarUrl: "https://placehold.co/100x100.png",
        academic: {
            standard: "10th",
            board: "CBSE",
            stream: "Science",
            language: "English",
            academicYear: "2024-2025",
            subjects: ["Maths", "Science", "English", "History", "General Knowledge"],
        },
        stats: {
            totalEarnings: 150,
            testsTaken: 5,
            avgScore: 88,
        },
        badges: ["Gold", "Silver"],
    }
];

// --- Simulation of Product Activation Codes ---

// In a real app, these would be securely generated and stored in a database after a purchase.
export let validActivationCodes = ["PROD-A1B2C", "PROD-X9Y8Z", "PROD-M4N5P"];

// Function to "use" a code, removing it from the valid list.
export function useActivationCode(code: string) {
    const index = validActivationCodes.indexOf(code);
    if (index > -1) {
        validActivationCodes.splice(index, 1);
    }
}

// Function to add a new student profile.
export function addStudent(student: StudentProfile) {
    studentData.push(student);
}

// Function to delete a student profile.
export function deleteStudent(studentId: string) {
    const index = studentData.findIndex(s => s.id === studentId);
    if (index > -1) {
        studentData.splice(index, 1);
    }
}
