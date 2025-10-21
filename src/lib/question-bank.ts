
'use client';

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

const defaultTestSets: TestSet[] = [
  {
    id: "SET-172234567890",
    name: "Gravitation Mock Test",
    board: "SSC",
    standard: "10th",
    subject: "Science",
    questions: [
      {
        id: "Q-172234567890-0",
        text: {
          en: "Why is it very difficult to detect gravitational waves?",
          mr: "गुरुत्वीय लहरी शोधणे खूप कठीण का आहे?"
        },
        options: {
          en: [
            "Because they are very fast",
            "Because they are very weak",
            "Because they are imaginary",
            "Because they do not travel to Earth"
          ],
          mr: [
            "कारण त्या खूप वेगवान असतात",
            "कारण त्या खूप क्षीण असतात",
            "कारण त्या काल्पनिक आहेत",
            "कारण त्या पृथ्वीपर्यंत पोहोचत नाहीत"
          ]
        },
        correctAnswer: {
          en: "Because they are very weak",
          mr: "कारण त्या खूप क्षीण असतात"
        }
      },
    ]
  }
];

let allTestSetsState: TestSet[] | null = null;

const initializeTestSets = (): TestSet[] => {
    if (allTestSetsState !== null) {
        return allTestSetsState;
    }
    
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('allTestSets');
        if (saved) {
            try {
                const parsedData = JSON.parse(saved);
                allTestSetsState = parsedData;
                return parsedData;
            } catch (e) {
                console.error("Failed to parse allTestSets from localStorage", e);
            }
        }
        allTestSetsState = JSON.parse(JSON.stringify(defaultTestSets));
        localStorage.setItem('allTestSets', JSON.stringify(allTestSetsState));
        return allTestSetsState;
    }

    allTestSetsState = JSON.parse(JSON.stringify(defaultTestSets));
    return allTestSetsState;
};

export const getAllTestSets = (): TestSet[] => {
    if (typeof window === 'undefined') {
        return JSON.parse(JSON.stringify(defaultTestSets));
    }
    return initializeTestSets();
};

const saveTestSets = (sets: TestSet[]) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('allTestSets', JSON.stringify(sets));
        allTestSetsState = sets;
    }
}

export function addTestSet(testSet: TestSet) {
    const sets = getAllTestSets();
    const existingIndex = sets.findIndex(ts => ts.id === testSet.id);

    if (existingIndex > -1) {
        console.warn(`Test set with ID ${testSet.id} already exists. It will be overwritten.`);
        sets[existingIndex] = testSet;
    } else {
        sets.push(testSet);
    }
    saveTestSets(sets);
}

export function updateTestSet(updatedTestSet: TestSet) {
    let sets = getAllTestSets();
    const index = sets.findIndex(ts => ts.id === updatedTestSet.id);
    if (index > -1) {
        sets[index] = updatedTestSet;
    } else {
        sets.push(updatedTestSet);
    }
    saveTestSets(sets);
}

export function deleteTestSet(testSetId: string) {
    let sets = getAllTestSets();
    const updatedSets = sets.filter(ts => ts.id !== testSetId);
    saveTestSets(updatedSets);
}
