
export type Question = {
  id: string;
  text: { en: string; mr: string };
  subject: string;
  standard: string;
  board: "CBSE" | "ICSE" | "SSC";
  options: { en: string[]; mr: string[] };
  correctAnswer: { en: string; mr: string };
};

// This acts as our shared, in-memory question bank "database".
// In a real application, this would be a database table.
export const allQuestions: Question[] = [
    { 
        id: "Q001", 
        text: { en: "What is the capital of France?", mr: "फ्रान्सची राजधानी कोणती?" },
        subject: "General Knowledge", 
        standard: "10th", 
        board: "CBSE",
        options: { en: ["Berlin", "Madrid", "Paris", "Rome"], mr: ["बर्लिन", "माद्रिद", "पॅरिस", "रोम"] },
        correctAnswer: { en: "Paris", mr: "पॅरिस" } 
    },
    { 
        id: "Q002", 
        text: { en: "What is 2 + 2?", mr: "२ + २ किती होतात?" },
        subject: "Mathematics", 
        standard: "10th", 
        board: "SSC",
        options: { en: ["3", "4", "5", "6"], mr: ["३", "४", "५", "६"] },
        correctAnswer: { en: "4", mr: "४" } 
    },
    { 
        id: "Q003", 
        text: { en: "Which gas is most abundant in the Earth's atmosphere?", mr: "पृथ्वीच्या वातावरणात कोणता वायू सर्वाधिक प्रमाणात आढळतो?" },
        subject: "Science", 
        standard: "11th", 
        board: "CBSE",
        options: { en: ["Oxygen", "Hydrogen", "Nitrogen", "Carbon Dioxide"], mr: ["ऑक्सिजन", "हायड्रोजन", "नायट्रोजन", "कार्बन डायऑक्साइड"] },
        correctAnswer: { en: "Nitrogen", mr: "नायट्रोजन" } 
    },
    { 
        id: "SC10-01", 
        text: { en: "What is the powerhouse of the cell?", mr: "पेशीचे ऊर्जाकेंद्र कोणते आहे?" },
        subject: "Science", 
        standard: "10th", 
        board: "SSC",
        options: { en: ["Nucleus", "Ribosome", "Mitochondrion", "Chloroplast"], mr: ["केंद्रक", "रायबोसोम", "माइटोकॉन्ड्रियन", "हरितलवक"] },
        correctAnswer: { en: "Mitochondrion", mr: "माइटोकॉन्ड्रियन" }
    },
    { 
        id: "SC10-02", 
        text: { en: "What is the chemical symbol for water?", mr: "पाण्याचे रासायनिक सूत्र काय आहे?" },
        subject: "Science", 
        standard: "10th", 
        board: "SSC",
        options: { en: ["O2", "H2O", "CO2", "NaCl"], mr: ["O2", "H2O", "CO2", "NaCl"] },
        correctAnswer: { en: "H2O", mr: "H2O" } 
    },
    { 
        id: "MT10-01", 
        text: { en: "What is the value of Pi (to 2 decimal places)?", mr: "पाय (π) चे मूल्य (२ दशांश स्थानांपर्यंत) काय आहे?" },
        subject: "Mathematics", 
        standard: "10th", 
        board: "CBSE",
        options: { en: ["3.14", "3.15", "3.16", "3.13"], mr: ["३.१४", "३.१५", "३.१६", "३.१३"] },
        correctAnswer: { en: "3.14", mr: "३.१४" } 
    },
    { 
        id: "EN10-01", 
        text: { en: "Who wrote 'Romeo and Juliet'?", mr: "'रोमियो आणि ज्युलिएट' कोणी लिहिले?" },
        subject: "English", 
        standard: "10th", 
        board: "ICSE",
        options: { en: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"], mr: ["चार्ल्स डिकन्स", "विल्यम शेक्सपियर", "जेन ऑस्टेन", "मार्क ट्वेन"] },
        correctAnswer: { en: "William Shakespeare", mr: "विल्यम शेक्सपियर" } 
    },
    { 
        id: "HS11-01", 
        text: { en: "In which year did World War II end?", mr: "दुसरे महायुद्ध कोणत्या वर्षी संपले?" },
        subject: "History", 
        standard: "11th", 
        board: "CBSE",
        options: { en: ["1943", "1944", "1945", "1946"], mr: ["१९४३", "१९४४", "१९४५", "१९४६"] },
        correctAnswer: { en: "1945", mr: "१९४५" }
    },
];
