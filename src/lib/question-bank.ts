
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
      // ... more questions from context
    ]
  }
];

let allTestSetsState: TestSet[] | null = null;

const getTestSets = (): TestSet[] => {
    if (typeof window === 'undefined') {
        return JSON.parse(JSON.stringify(defaultTestSets));
    }
    if (!allTestSetsState) {
        const saved = localStorage.getItem('allTestSets');
        if (saved) {
            try {
                allTestSetsState = JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse allTestSets from localStorage", e);
                allTestSetsState = JSON.parse(JSON.stringify(defaultTestSets));
            }
        } else {
            allTestSetsState = JSON.parse(JSON.stringify(defaultTestSets));
        }
    }
    return allTestSetsState!;
};

const saveTestSets = () => {
    if (typeof window !== 'undefined' && allTestSetsState) {
        localStorage.setItem('allTestSets', JSON.stringify(allTestSetsState));
    }
}

export const allTestSets: TestSet[] = (typeof window !== 'undefined') ? getTestSets() : defaultTestSets;


export function addTestSet(testSet: TestSet) {
    const sets = getTestSets();
    const existingIndex = sets.findIndex(ts => ts.id === testSet.id);

    if (existingIndex > -1) {
        console.warn(`Test set with ID ${testSet.id} already exists. It will be overwritten.`);
        sets[existingIndex] = testSet;
    } else {
        sets.push(testSet);
    }
    allTestSetsState = sets;
    saveTestSets();
    // Update the exported variable
    Object.assign(allTestSets, allTestSetsState);
}

export function updateTestSet(updatedTestSet: TestSet) {
    let sets = getTestSets();
    const index = sets.findIndex(ts => ts.id === updatedTestSet.id);
    if (index > -1) {
        sets[index] = updatedTestSet;
    } else {
        sets.push(updatedTestSet);
    }
    allTestSetsState = sets;
    saveTestSets();
    Object.assign(allTestSets, allTestSetsState);
}

export function deleteTestSet(testSetId: string) {
    let sets = getTestSets();
    allTestSetsState = sets.filter(ts => ts.id !== testSetId);
    saveTestSets();
    // Clear and repopulate the exported array
    allTestSets.length = 0;
    Array.prototype.push.apply(allTestSets, allTestSetsState);
}
