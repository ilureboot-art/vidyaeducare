
export type StudentProfile = {
  id: string;
  name: string;
  dob: string;
  avatarUrl: string;
  academic: {
      standard: string;
      board: "CBSE" | "ICSE" | "SSC";
      stream: string;
      language: string;
      academicYear: string;
      subjects: string[];
  },
  stats: {
    totalEarnings: number;
    testsTaken: number;
    avgScore: number;
    performance: { name: string; score: number }[];
    recentActivity: { name: string; score: number }[];
  },
  badges: ('Platinum' | 'Gold' | 'Silver' | 'Bronze')[];
};

// This object acts as our in-memory, shared "database" for student profiles.
export const studentData: StudentProfile[] = [
  {
    id: "STU-123456",
    name: "Rohan Gurav",
    dob: "2008-05-10",
    avatarUrl: `https://placehold.co/100x100.png?text=RG`,
    academic: {
        standard: "10th",
        board: "SSC",
        stream: "General",
        language: 'English',
        academicYear: '2024-2025',
        subjects: ['Maths', 'Science', 'English', 'History', 'General Knowledge'],
    },
    stats: {
        totalEarnings: 150,
        testsTaken: 2,
        avgScore: 85,
        performance: [{ name: 'Gravitation', score: 88 }, { name: 'Elements', score: 82 }],
        recentActivity: [],
    },
    badges: ['Gold'],
  },
  {
    id: "STU-789012",
    name: "Priya Sharma",
    dob: "2007-09-22",
    avatarUrl: `https://placehold.co/100x100.png?text=PS`,
    academic: {
        standard: "11th",
        board: "CBSE",
        stream: "Science",
        language: 'English',
        academicYear: '2024-2025',
        subjects: ['Physics', 'Chemistry', 'Maths', 'English'],
    },
    stats: {
        totalEarnings: 50,
        testsTaken: 1,
        avgScore: 78,
        performance: [{ name: 'Kinematics', score: 78 }],
        recentActivity: [],
    },
    badges: ['Silver'],
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
