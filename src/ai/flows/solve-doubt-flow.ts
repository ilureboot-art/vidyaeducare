'use server';
/**
 * @fileOverview A flow for solving student doubts about specific MCQ questions.
 *
 * - solveDoubt - A function that provides bilingual explanations for MCQs.
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
    }),
    context: z.object({
        subject: z.string(),
        standard: z.string(),
        board: z.string(),
    }),
    userDoubt: z.string().optional().describe('Specific question or doubt from the user.'),
});
export type SolveDoubtInput = z.infer<typeof SolveDoubtInputSchema>;

const SolveDoubtOutputSchema = z.object({
  explanation: z.object({
    en: z.string().describe('Clear, pedagogical explanation in English.'),
    mr: z.string().describe('Clear, pedagogical explanation in Marathi.'),
  }),
  keyConcept: z.string().describe('The core scientific or academic concept being tested.'),
});
export type SolveDoubtOutput = z.infer<typeof SolveDoubtOutputSchema>;

export async function solveDoubt(input: SolveDoubtInput): Promise<SolveDoubtOutput> {
  return solveDoubtFlow(input);
}

const prompt = ai.definePrompt({
  name: 'solveDoubtPrompt',
  input: { schema: SolveDoubtInputSchema },
  output: { schema: SolveDoubtOutputSchema },
  prompt: `You are an expert tutor for the {{{context.board}}} board, teaching {{{context.standard}}} {{{context.subject}}}.

  A student has a doubt about the following multiple-choice question:
  Question (English): {{{question.text.en}}}
  Question (Marathi): {{{question.text.mr}}}

  Options:
  {{#each question.options.en}}
  - Option {{@index}}: {{{this}}} (Marathi: {{{lookup ../question.options.mr @index}}})
  {{/each}}

  Correct Answer: {{{question.correctAnswer.en}}} ({{{question.correctAnswer.mr}}})

  {{#if userDoubt}}
  Student's specific doubt: {{{userDoubt}}}
  {{/if}}

  Your task:
  1. Provide a clear, step-by-step explanation of why the correct answer is right.
  2. Briefly explain why common distractors (incorrect options) are wrong.
  3. Ensure the explanation is pedagogical, encouraging, and easy for a {{{context.standard}}} student to understand.
  4. Provide the explanation in BOTH English and Marathi.
  5. Identify the "Key Concept" used in the question.

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
