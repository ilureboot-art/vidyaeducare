
export type Question = {
  id: string;
  text: { en: string; mr: string };
  options: { en: string[]; mr: string[] };
  correctAnswer: { en: string; mr: string };
};

export type TestSet = {
  id: string;
  name: string; // e.g., "SSC Science Test #1"
  board: "CBSE" | "ICSE" | "SSC";
  standard: string;
  subject: string;
  questions: Question[]; // Exactly 50 questions
};


// This acts as our shared, in-memory question bank "database".
// It now stores TestSets instead of individual questions.
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
    // Check if a set with the same name already exists for the same board/standard/subject
    const existingIndex = allTestSets.findIndex(ts => 
        ts.name === testSet.name &&
        ts.board === testSet.board &&
        ts.standard === testSet.standard &&
        ts.subject === testSet.subject
    );

    if (existingIndex > -1) {
        // Update existing test set
        allTestSets[existingIndex] = testSet;
    } else {
        // Add new test set
        allTestSets.push(testSet);
    }
}

export function deleteTestSet(testSetId: string) {
    const indexToDelete = allTestSets.findIndex(ts => ts.id === testSetId);
    if (indexToDelete > -1) {
        allTestSets.splice(indexToDelete, 1);
    }
}

// Function to get all questions from all sets for a specific criteria.
// This is still useful if we ever need to show a mixed pool of questions.
export function getQuestionsForCriteria(board: string, standard: string, subject: string): Question[] {
    const questions: Question[] = [];
    allTestSets.forEach(set => {
        if (set.board === board && set.standard === standard && set.subject === subject) {
            questions.push(...set.questions);
        }
    });
    return questions;
}
