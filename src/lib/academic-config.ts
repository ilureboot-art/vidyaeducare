
'use client';

export type AcademicConfig = {
    boards: string[];
    standards: string[];
    subjects: string[];
};

const defaultAcademicConfig: AcademicConfig = {
    boards: ["CBSE", "ICSE", "SSC"],
    standards: [
        "1st", "2nd", "3rd", "4th", "5th", "6th",
        "7th", "8th", "9th", "10th", "11th", "12th"
    ],
    subjects: [
        "General Knowledge",
        "Mathematics",
        "Science",
        "English",
        "History"
    ]
};

let academicConfigState: AcademicConfig | null = null;

function initializeAcademicConfig(): AcademicConfig {
    if (typeof window !== 'undefined') {
        const savedConfig = localStorage.getItem('academicConfig');
        if (savedConfig) {
            try {
                return JSON.parse(savedConfig);
            } catch (e) {
                console.error("Failed to parse academicConfig from localStorage", e);
            }
        }
    }
    return { ...defaultAcademicConfig };
}

export const getAcademicConfig = (): AcademicConfig => {
    if (!academicConfigState) {
        academicConfigState = initializeAcademicConfig();
    }
    return academicConfigState;
};

const saveAcademicConfig = (config: AcademicConfig) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('academicConfig', JSON.stringify(config));
        academicConfigState = config;
    }
};

// --- Setter functions to allow admin panel to modify the config ---

export function setBoards(newBoards: string[]) {
    const config = getAcademicConfig();
    config.boards = newBoards.filter(b => b.trim() !== '');
    saveAcademicConfig(config);
}

export function setStandards(newStandards: string[]) {
    const config = getAcademicConfig();
    config.standards = newStandards.filter(s => s.trim() !== '');
    saveAcademicConfig(config);
}

export function setSubjects(newSubjects: string[]) {
    const config = getAcademicConfig();
    config.subjects = newSubjects.filter(s => s.trim() !== '');
    saveAcademicConfig(config);
}
