
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
        id: "STU-001",
        name: "Alex Doe",
        dob: "2008-05-15",
        avatarUrl: "https://placehold.co/100x100.png",
        academic: {
            standard: "10th",
            board: "CBSE",
            stream: "Science",
            language: "English",
            academicYear: "2024-2025",
            subjects: ["Maths", "Science", "English"],
        },
        stats: {
            totalEarnings: 0,
            testsTaken: 0,
            avgScore: 0,
        },
        badges: ["Gold", "Silver"],
    }
];

    