
export type Question = {
  id: string;
  text: { en: string; hi: string };
  subject: string;
  standard: string;
  options: { en: string[]; hi: string[] };
  correctAnswer: { en: string; hi: string };
};

// This acts as our shared, in-memory question bank "database".
// In a real application, this would be a database table.
export const allQuestions: Question[] = [
    { 
        id: "Q001", 
        text: { en: "What is the capital of France?", hi: "फ्रांस की राजधानी क्या है?" },
        subject: "General Knowledge", 
        standard: "10th", 
        options: { en: ["Berlin", "Madrid", "Paris", "Rome"], hi: ["बर्लिन", "मैड्रिड", "पेरिस", "रोम"] },
        correctAnswer: { en: "Paris", hi: "पेरिस" } 
    },
    { 
        id: "Q002", 
        text: { en: "What is 2 + 2?", hi: "2 + 2 क्या है?" },
        subject: "Mathematics", 
        standard: "10th", 
        options: { en: ["3", "4", "5", "6"], hi: ["3", "4", "5", "6"] },
        correctAnswer: { en: "4", hi: "4" } 
    },
    { 
        id: "Q003", 
        text: { en: "Which gas is most abundant in the Earth's atmosphere?", hi: "पृथ्वी के वायुमंडल में कौन सी गैस सबसे प्रचुर मात्रा में है?" },
        subject: "Science", 
        standard: "11th", 
        options: { en: ["Oxygen", "Hydrogen", "Nitrogen", "Carbon Dioxide"], hi: ["ऑक्सीजन", "हाइड्रोजन", "नाइट्रोजन", "कार्बन डाइऑक्साइड"] },
        correctAnswer: { en: "Nitrogen", hi: "नाइट्रोजन" } 
    },
    { 
        id: "SC10-01", 
        text: { en: "What is the powerhouse of the cell?", hi: "कोशिका का पावरहाउस क्या है?" },
        subject: "Science", 
        standard: "10th", 
        options: { en: ["Nucleus", "Ribosome", "Mitochondrion", "Chloroplast"], hi: ["नाभिक", "राइबोसोम", "माइटोकॉन्ड्रियन", "क्लोरोप्लास्ट"] },
        correctAnswer: { en: "Mitochondrion", hi: "माइटोकॉन्ड्रियन" }
    },
    { 
        id: "SC10-02", 
        text: { en: "What is the chemical symbol for water?", hi: "पानी का रासायनिक प्रतीक क्या है?" },
        subject: "Science", 
        standard: "10th", 
        options: { en: ["O2", "H2O", "CO2", "NaCl"], hi: ["O2", "H2O", "CO2", "NaCl"] },
        correctAnswer: { en: "H2O", hi: "H2O" } 
    },
    { 
        id: "MT10-01", 
        text: { en: "What is the value of Pi (to 2 decimal places)?", hi: "पाई का मान (2 दशमलव स्थानों तक) क्या है?" },
        subject: "Mathematics", 
        standard: "10th", 
        options: { en: ["3.14", "3.15", "3.16", "3.13"], hi: ["3.14", "3.15", "3.16", "3.13"] },
        correctAnswer: { en: "3.14", hi: "3.14" } 
    },
    { 
        id: "EN10-01", 
        text: { en: "Who wrote 'Romeo and Juliet'?", hi: "'रोमियो और जूलियट' किसने लिखा?" },
        subject: "English", 
        standard: "10th", 
        options: { en: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"], hi: ["चार्ल्स डिकेंस", "विलियम शेक्सपियर", "जेन ऑस्टेन", "मार्क ट्वेन"] },
        correctAnswer: { en: "William Shakespeare", hi: "विलियम शेक्सपियर" } 
    },
    { 
        id: "HS11-01", 
        text: { en: "In which year did World War II end?", hi: "द्वितीय विश्व युद्ध किस वर्ष समाप्त हुआ?" },
        subject: "History", 
        standard: "11th", 
        options: { en: ["1943", "1944", "1945", "1946"], hi: ["1943", "1944", "1945", "1946"] },
        correctAnswer: { en: "1945", hi: "1945" }
    },
];

    