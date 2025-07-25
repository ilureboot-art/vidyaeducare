
export type Question = {
  id: string;
  text: { en: string; mr: string };
  options: { en: string[]; mr: string[] };
  correctAnswer: { en: string; mr: string };
};

export type TestSet = {
  id: string;
  name: string;
  board: "CBSE" | "ICSE" | "SSC";
  standard: string;
  subject: string;
  questions: Question[];
};


export let allTestSets: TestSet[] = [
    { 
        id: "SET-SSC-SCI-10-01",
        name: "SSC Science Practice Set 1",
        board: "SSC",
        standard: "10th",
        subject: "Science",
        questions: Array.from({ length: 50 }, (_, i) => ({
            id: `Q-SSC-SCI-10-01-${i+1}`,
            text: { en: `Sample Science Question ${i+1} for SSC 10th?`, mr: `एसएससी १०वी साठी नमुना विज्ञान प्रश्न ${i+1}?` },
            options: { en: ["Option A", "Option B", "Option C", "Option D"], mr: ["पर्याय अ", "पर्याय ब", "पर्याय क", "पर्याय ड"] },
            correctAnswer: { en: "Option A", mr: "पर्याय अ" }
        }))
    },
    { 
        id: "SET-CBSE-MATH-10-01",
        name: "CBSE Maths Practice Set 1",
        board: "CBSE",
        standard: "10th",
        subject: "Mathematics",
        questions: Array.from({ length: 50 }, (_, i) => ({
            id: `Q-CBSE-MATH-10-01-${i+1}`,
            text: { en: `Sample Maths Question ${i+1} for CBSE 10th?`, mr: `सीबीएसई १०वी साठी नमुना गणित प्रश्न ${i+1}?` },
            options: { en: ["Option A", "Option B", "Option C", "Option D"], mr: ["पर्याय अ", "पर्याय ब", "पर्याय क", "पर्याय ड"] },
            correctAnswer: { en: "Option A", mr: "पर्याय अ" }
        }))
    },
];

export function addTestSet(testSet: TestSet) {
    const existingIndex = allTestSets.findIndex(ts => ts.id === testSet.id);

    if (existingIndex > -1) {
        allTestSets[existingIndex] = testSet;
    } else {
        allTestSets.push(testSet);
    }
}

export function updateTestSet(updatedTestSet: TestSet) {
    const index = allTestSets.findIndex(ts => ts.id === updatedTestSet.id);
    if (index > -1) {
        allTestSets[index] = updatedTestSet;
    } else {
        // If it doesn't exist, add it. This can happen if an ID changes, though unlikely.
        addTestSet(updatedTestSet);
    }
}

export function deleteTestSet(testSetId: string) {
    const indexToDelete = allTestSets.findIndex(ts => ts.id === testSetId);
    if (indexToDelete > -1) {
        allTestSets.splice(indexToDelete, 1);
    }
}
