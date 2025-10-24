
'use server';
/**
 * @fileOverview An AI flow for generating Multiple Choice Questions (MCQs).
 *
 * - generateMcqs - A function that handles the MCQ generation process.
 * - McqGeneratorInput - The input type for the generateMcqs function.
 * - McqGeneratorOutput - The return type for the generateMcqs function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { QuestionParserOutputSchema } from './document-parser-flow';

export const McqGeneratorInputSchema = z.object({
  board: z.string().describe('The education board (e.g., "SSC", "CBSE").'),
  standard: z.string().describe('The academic standard or grade level (e.g., "10th", "12th").'),
  subject: z.string().describe('The subject for the questions (e.g., "Science", "History").'),
  chapterName: z.string().describe('The name of the chapter or topic to generate questions from.'),
  numQuestions: z.number().describe('The number of MCQs to generate.'),
});
export type McqGeneratorInput = z.infer<typeof McqGeneratorInputSchema>;

export type McqGeneratorOutput = z.infer<typeof QuestionParserOutputSchema>;


export async function generateMcqs(input: McqGeneratorInput): Promise<McqGeneratorOutput> {
  return mcqGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'mcqGeneratorPrompt',
  input: { schema: McqGeneratorInputSchema },
  output: { schema: QuestionParserOutputSchema },
  prompt: `You are an expert in creating educational content. Your task is to generate a specified number of high-quality Multiple Choice Questions (MCQs) for a given chapter, subject, standard, and board.

For each question you generate, you must:
1.  Create a clear and relevant question text based on the chapter topic.
2.  Provide four distinct multiple-choice options.
3.  Identify the single correct answer from the options.
4.  Translate the question text, all four options, and the correct answer accurately into Marathi.
5.  Format the output into the required JSON structure.

Generate the questions based on the following details:

Board: {{{board}}}
Standard: {{{standard}}}
Subject: {{{subject}}}
Chapter: {{{chapterName}}}
Number of Questions to Generate: {{{numQuestions}}}
`,
});

const mcqGeneratorFlow = ai.defineFlow(
  {
    name: 'mcqGeneratorFlow',
    inputSchema: McqGeneratorInputSchema,
    outputSchema: QuestionParserOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output || [];
  }
);
