
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

const initializeAcademicConfig = (): AcademicConfig => {
    // This function should only be called on the client
    const savedConfig = localStorage.getItem('academicConfig');
    if (savedConfig) {
        try {
            const parsedConfig = JSON.parse(savedConfig);
            if (parsedConfig && parsedConfig.boards) {
                academicConfigState = parsedConfig;
                return parsedConfig;
            }
        } catch (e) {
            console.error("Failed to parse academicConfig from localStorage", e);
        }
    }
    academicConfigState = { ...defaultAcademicConfig };
    localStorage.setItem('academicConfig', JSON.stringify(academicConfigState));
    return academicConfigState;
};

export const getAcademicConfig = (): AcademicConfig => {
    if (typeof window === 'undefined') {
        // Return a safe default for server-side rendering
        return { ...defaultAcademicConfig };
    }
    if (academicConfigState === null) {
        return initializeAcademicConfig();
    }
    return academicConfigState;
};

const saveAcademicConfig = (config: AcademicConfig) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('academicConfig', JSON.stringify(config));
        academicConfigState = config;
    }
};

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
