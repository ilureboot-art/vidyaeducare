
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

export const getAcademicConfig = (): AcademicConfig => {
    if (academicConfigState) {
        return academicConfigState;
    }
    if (typeof window !== 'undefined') {
        try {
            const savedConfig = localStorage.getItem('academicConfig');
            if (savedConfig) {
                const parsedConfig = JSON.parse(savedConfig);
                 if (parsedConfig && parsedConfig.boards) {
                    academicConfigState = parsedConfig;
                    return academicConfigState;
                }
            }
        } catch (e) {
            console.error("Failed to parse academicConfig from localStorage", e);
        }
        academicConfigState = JSON.parse(JSON.stringify(defaultAcademicConfig));
        localStorage.setItem('academicConfig', JSON.stringify(academicConfigState));
        return academicConfigState;
    }
    return JSON.parse(JSON.stringify(defaultAcademicConfig));
};

export const saveAcademicConfig = (config: AcademicConfig) => {
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
