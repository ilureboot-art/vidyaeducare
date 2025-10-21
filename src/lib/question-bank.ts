
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

export const defaultTestSets: TestSet[] = [
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
