
export type Question = {
  id: string;
  text: string;
  subject: string;
  standard: string;
  options: string[];
  correctAnswer: string;
};

// This acts as our shared, in-memory question bank "database".
// In a real application, this would be a database table.
export const allQuestions: Question[] = [
    { id: "Q001", text: "What is the capital of France?", subject: "General Knowledge", standard: "10th", options: ["Berlin", "Madrid", "Paris", "Rome"], correctAnswer: "Paris" },
    { id: "Q002", text: "What is 2 + 2?", subject: "Mathematics", standard: "10th", options: ["3", "4", "5", "6"], correctAnswer: "4" },
    { id: "Q003", text: "Which gas is most abundant in the Earth's atmosphere?", subject: "Science", standard: "11th", options: ["Oxygen", "Hydrogen", "Nitrogen", "Carbon Dioxide"], correctAnswer: "Nitrogen" },
    { id: "SC10-01", text: "What is the powerhouse of the cell?", subject: "Science", standard: "10th", options: ["Nucleus", "Ribosome", "Mitochondrion", "Chloroplast"], correctAnswer: "Mitochondrion" },
    { id: "SC10-02", text: "What is the chemical symbol for water?", subject: "Science", standard: "10th", options: ["O2", "H2O", "CO2", "NaCl"], correctAnswer: "H2O" },
    { id: "MT10-01", text: "What is the value of Pi (to 2 decimal places)?", subject: "Mathematics", standard: "10th", options: ["3.14", "3.15", "3.16", "3.13"], correctAnswer: "3.14" },
    { id: "EN10-01", text: "Who wrote 'Romeo and Juliet'?", subject: "English", standard: "10th", options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"], correctAnswer: "William Shakespeare" },
    { id: "HS11-01", text: "In which year did World War II end?", subject: "History", standard: "11th", options: ["1943", "1944", "1945", "1946"], correctAnswer: "1945" },
];
