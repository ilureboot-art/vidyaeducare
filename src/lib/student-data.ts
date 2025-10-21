
'use client';

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

export const defaultStudentData: StudentProfile[] = [
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

export const defaultActivationCodes = ["PROD-A1B2C", "PROD-X9Y8Z", "PROD-M4N5P"];

    