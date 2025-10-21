
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

const defaultStudentData: StudentProfile[] = [
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

let studentDataState: StudentProfile[] | null = null;
let validActivationCodesState: string[] | null = null;

const defaultActivationCodes = ["PROD-A1B2C", "PROD-X9Y8Z", "PROD-M4N5P"];

const initializeStudentData = (): StudentProfile[] => {
    if (studentDataState !== null) {
        return studentDataState;
    }
    if (typeof window !== 'undefined') {
        const savedData = localStorage.getItem('studentData');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                studentDataState = parsedData;
                return parsedData;
            } catch (e) {
                console.error("Failed to parse studentData from localStorage", e);
            }
        }
    }
    studentDataState = JSON.parse(JSON.stringify(defaultStudentData));
    if (typeof window !== 'undefined') {
        localStorage.setItem('studentData', JSON.stringify(studentDataState));
    }
    return studentDataState;
};

export const getAllStudentData = (): StudentProfile[] => {
    if (typeof window === 'undefined') {
        return JSON.parse(JSON.stringify(defaultStudentData));
    }
    return initializeStudentData();
};

const initializeActivationCodes = (): string[] => {
    if (validActivationCodesState !== null) {
        return validActivationCodesState;
    }
    if (typeof window !== 'undefined') {
        const savedCodes = localStorage.getItem('activationCodes');
        if (savedCodes) {
            try {
                const parsedCodes = JSON.parse(savedCodes);
                validActivationCodesState = parsedCodes;
                return parsedCodes;
            } catch(e) {
                 console.error("Failed to parse activationCodes from localStorage", e);
            }
        }
    }
    validActivationCodesState = [...defaultActivationCodes];
    if (typeof window !== 'undefined') {
        localStorage.setItem('activationCodes', JSON.stringify(validActivationCodesState));
    }
    return validActivationCodesState;
};

export const getActivationCodes = (): string[] => {
    if (typeof window === 'undefined') {
        return [...defaultActivationCodes];
    }
    return initializeActivationCodes();
}

const saveStudentData = (data: StudentProfile[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('studentData', JSON.stringify(data));
    studentDataState = data;
  }
};

const saveActivationCodes = (codes: string[]) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('activationCodes', JSON.stringify(codes));
        validActivationCodesState = codes;
    }
};


export function useActivationCode(code: string) {
    let codes = getActivationCodes();
    const index = codes.indexOf(code);
    if (index > -1) {
        codes.splice(index, 1);
        saveActivationCodes(codes);
    }
}

export function addStudent(student: StudentProfile) {
    const data = getAllStudentData();
    data.push(student);
    saveStudentData(data);
}

export function deleteStudent(studentId: string) {
    let data = getAllStudentData();
    const updatedData = data.filter(s => s.id !== studentId);
    saveStudentData(updatedData);
}

export function updateStudent(updatedStudent: StudentProfile) {
    let data = getAllStudentData();
    const index = data.findIndex(s => s.id === updatedStudent.id);
    if (index > -1) {
        data[index] = updatedStudent;
        saveStudentData(data);
    }
}

export function resetStudentData() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('studentData');
        localStorage.removeItem('activationCodes');
    }
    studentDataState = null;
    validActivationCodesState = null;
}
