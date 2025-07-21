
export let academicConfig = {
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

// --- Setter functions to allow admin panel to modify the config ---

export function setBoards(newBoards: string[]) {
    academicConfig.boards = newBoards.filter(b => b.trim() !== '');
}

export function setStandards(newStandards: string[]) {
    academicConfig.standards = newStandards.filter(s => s.trim() !== '');
}

export function setSubjects(newSubjects: string[]) {
    academicConfig.subjects = newSubjects.filter(s => s.trim() !== '');
}
