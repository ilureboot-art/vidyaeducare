'use server';
/**
 * @fileOverview A flow for solving student doubts about academic topics or specific MCQs.
 */

import { ai, z } from '@/ai/genkit';

const SolveDoubtInputSchema = z.object({
    question: z.object({
        text: z.object({ en: z.string(), mr: z.string() }),
        options: z.object({ en: z.array(z.string()), mr: z.array(z.string()) }),
        correctAnswer: z.object({ en: z.string(), mr: z.string() }),
    }).optional().describe('Optional MCQ context if the doubt is about a specific question.'),
    context: z.object({
        subject: z.string().optional(),
        standard: z.string().optional(),
        board: z.string().optional(),
    }).optional(),
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

const solveDoubtPrompt = ai.definePrompt({
  name: 'solveDoubtPrompt',
  input: { schema: SolveDoubtInputSchema },
  output: { schema: SolveDoubtOutputSchema },
  prompt: `You are an expert academic tutor specializing in the Indian school curriculum.
  
  Context:
  {{#if context.board}}Board: {{{context.board}}}{{/if}}
  {{#if context.standard}}Grade: {{{context.standard}}}{{/if}}
  {{#if context.subject}}Subject: {{{context.subject}}}{{/if}}

  {{#if question}}
  Specific MCQ Context:
  Question (English): {{{question.text.en}}}
  Question (Marathi): {{{question.text.mr}}}
  Correct Answer: {{{question.correctAnswer.en}}}
  
  Student's Query: "{{{userDoubt}}}"
  {{else}}
  Student's Query: "{{{userDoubt}}}"
  {{/if}}

  Your Task:
  1. Provide a clear, pedagogical explanation in both English and Marathi.
  2. Be encouraging and use language appropriate for the student's grade level.
  3. Identify the "Key Concept" addressed.
  4. Ensure the explanation is step-by-step.

  Response must be valid JSON matching the schema.`,
});

const solveDoubtFlow = ai.defineFlow(
  {
    name: 'solveDoubtFlow',
    inputSchema: SolveDoubtInputSchema,
    outputSchema: SolveDoubtOutputSchema,
  },
  async (input) => {
    const { output } = await solveDoubtPrompt(input);
    if (!output) {
      throw new Error('Failed to generate AI tutor response.');
    }
    return output;
  }
);

export async function solveDoubt(input: SolveDoubtInput): Promise<SolveDoubtOutput> {
  return solveDoubtFlow(input);
}
