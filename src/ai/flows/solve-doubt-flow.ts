'use server';
/**
 * @fileOverview A flow for solving student doubts about academic topics or specific MCQs.
 *
 * - solveDoubt - A function that provides bilingual explanations for any educational query.
 * - SolveDoubtInput - The input type for the solveDoubt function.
 * - SolveDoubtOutput - The return type for the solveDoubt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SolveDoubtInputSchema = z.object({
    question: z.object({
        text: z.object({ en: z.string(), mr: z.string() }),
        options: z.object({ en: z.array(z.string()), mr: z.array(z.string()) }),
        correctAnswer: z.object({ en: z.string(), mr: z.string() }),
    }).optional().describe('Optional MCQ context if the doubt is about a specific question.'),
    context: z.object({
        subject: z.string().optional(),
        standard: z.string(),
        board: z.string(),
    }),
    userDoubt: z.string().describe('The student\'s question or specific doubt.'),
});
export type SolveDoubtInput = z.infer<typeof SolveDoubtInputSchema>;

const SolveDoubtOutputSchema = z.object({
  explanation: z.object({
    en: z.string().describe('Clear, pedagogical explanation in English.'),
    mr: z.string().describe('Clear, pedagogical explanation in Marathi.'),
  }),
  keyConcept: z.string().describe('The core scientific or academic concept being addressed.'),
});
export type SolveDoubtOutput = z.infer<typeof SolveDoubtOutputSchema>;

export async function solveDoubt(input: SolveDoubtInput): Promise<SolveDoubtOutput> {
  return solveDoubtFlow(input);
}

const prompt = ai.definePrompt({
  name: 'solveDoubtPrompt',
  input: { schema: SolveDoubtInputSchema },
  output: { schema: SolveDoubtOutputSchema },
  prompt: `You are an expert tutor for the {{{context.board}}} board, teaching {{{context.standard}}} {{{#if context.subject}}}{{{context.subject}}}{{{/if}}}.

  {{#if question}}
  A student has a doubt about this specific MCQ:
  Question: {{{question.text.en}}} ({{{question.text.mr}}})
  Options: 
  {{#each question.options.en}} - {{{this}}} (Marathi: {{{lookup ../question.options.mr @index}}}) {{/each}}
  Correct Answer: {{{question.correctAnswer.en}}}

  Student's specific question: {{{userDoubt}}}
  {{else}}
  A student is asking a general academic question:
  "{{{userDoubt}}}"
  {{/if}}

  Your task:
  1. Provide a clear, step-by-step explanation or answer.
  2. If an MCQ was provided, explain why the correct answer is right and why others are wrong.
  3. Ensure the explanation is pedagogical, encouraging, and easy for a {{{context.standard}}} student to understand.
  4. Provide the explanation in BOTH English and Marathi.
  5. Identify the "Key Concept" involved.

  Use a friendly tutor-like tone.`,
});

const solveDoubtFlow = ai.defineFlow(
  {
    name: 'solveDoubtFlow',
    inputSchema: SolveDoubtInputSchema,
    outputSchema: SolveDoubtOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('The AI tutor was unable to generate an explanation at this time.');
    }
    return output;
  }
);
