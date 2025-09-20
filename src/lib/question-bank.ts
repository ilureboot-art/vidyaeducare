
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


export let allTestSets: TestSet[] = [];

export function addTestSet(testSet: TestSet) {
    const existingIndex = allTestSets.findIndex(ts => ts.id === testSet.id);

    if (existingIndex > -1) {
        console.warn(`Test set with ID ${testSet.id} already exists. It will be overwritten.`);
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
