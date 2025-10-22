
'use server';
/**
 * @fileOverview An AI flow for parsing questions from a document.
 *
 * - parseQuestionsFromDocument - A function that handles the question parsing process.
 * - QuestionParserInput - The input type for the parseQuestionsFromDocument function.
 * - QuestionParserOutput - The return type for the parseQuestionsFromDocument function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const QuestionParserInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A document (like a PDF or DOCX) containing multiple choice questions, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  topic: z.string().describe('The main topic or subject of the questions.'),
  standard: z.string().describe('The academic standard or grade level (e.g., "10th", "12th").'),
});
export type QuestionParserInput = z.infer<typeof QuestionParserInputSchema>;

export const QuestionSchema = z.object({
    text: z.object({
        en: z.string().describe("The full question text in English."),
        mr: z.string().describe("The full question text translated into Marathi."),
    }),
    options: z.object({
        en: z.array(z.string()).length(4).describe("The four answer options in English."),
        mr: z.array(z.string()).length(4).describe("The four answer options translated into Marathi."),
    }),
    correctAnswer: z.object({
        en: z.string().describe("The correct answer option in English."),
        mr: z.string().describe("The correct answer option translated into Marathi."),
    }),
});

export const QuestionParserOutputSchema = z.array(QuestionSchema);
export type QuestionParserOutput = z.infer<typeof QuestionParserOutputSchema>;


export async function parseQuestionsFromDocument(input: QuestionParserInput): Promise<QuestionParserOutput> {
  return documentParserFlow(input);
}

const prompt = ai.definePrompt({
  name: 'documentParserPrompt',
  input: { schema: QuestionParserInputSchema },
  output: { schema: QuestionParserOutputSchema },
  prompt: `You are an expert at parsing educational documents to extract multiple-choice questions (MCQs).
You will be given a document for a specific topic and standard. Your task is to extract all the MCQs from this document.

For each question you find, you must perform the following steps:
1.  Identify the question text, the four multiple-choice options, and the correct answer.
2.  Translate the question text and all four options accurately into Marathi.
3.  Format the extracted and translated information into the required JSON output structure. Ensure the correct answer in Marathi corresponds to the correct answer in English.

Analyze the following document and extract the questions.

Topic: {{{topic}}}
Standard: {{{standard}}}
Document: {{media url=documentDataUri}}`,
});

const documentParserFlow = ai.defineFlow(
  {
    name: 'documentParserFlow',
    inputSchema: QuestionParserInputSchema,
    outputSchema: QuestionParserOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output || [];
  }
);

    