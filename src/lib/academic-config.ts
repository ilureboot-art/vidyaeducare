
'use client';

/**
 * @fileOverview Global academic configuration defaults.
 * These values are used to populate the initial system state.
 */

export type AcademicConfig = {
    boards: string[];
    standards: string[];
    subjects: string[];
};

export const defaultAcademicConfig: AcademicConfig = {
    boards: ["CBSE", "ICSE", "SSC"],
    standards: [
        "1st", "2nd", "3rd", "4th", "5th", "6th",
        "7th", "8th", "9th", "10th", "11th", "12th"
    ],
    subjects: [
        "Marathi",
        "Kumarbharati",
        "Sugam bharati",
        "Sulabh Bharati",
        "Maths I",
        "Maths II",
        "Science I",
        "Science II",
        "EVS",
        "English",
        "History",
        "General Knowledge"
    ]
};
