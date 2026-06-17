
'use server';
/**
 * @fileOverview A flow for solving student doubts about academic topics or specific MCQs.
 * 
 * - solveDoubt - Server action to trigger the pedagogical explanation flow.
 * - SolveDoubtInput - Input schema for doubts and question context.
 * - SolveDoubtOutput - Structured bilingual explanation result.
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
  system: `You are an expert academic tutor specializing in the Indian school curriculum (SSC, CBSE, ICSE). 
Your goal is to provide deep conceptual clarity to students. 
Always provide explanations in both Marathi and English. 
The Marathi explanation should be pedagogical, encouraging, and easy to understand for the student's specified grade level.
The English explanation should be conceptually accurate and academic.
Identify the "Key Concept" (one or two words) that the query relates to.`,
  prompt: `
  {{#if context}}
  Context:
  {{#if context.board}}Board: {{{context.board}}}{{/if}}
  {{#if context.standard}}Grade: {{{context.standard}}}{{/if}}
  {{#if context.subject}}Subject: {{{context.subject}}}{{/if}}
  {{/if}}

  {{#if question}}
  Specific MCQ Being Discussed:
  Question (English): {{{question.text.en}}}
  Question (Marathi): {{{question.text.mr}}}
  Correct Answer: {{{question.correctAnswer.en}}}
  
  Student's Doubt: {{{userDoubt}}}
  {{else}}
  Student's Query: {{{userDoubt}}}
  {{/if}}

  Please provide a detailed bilingual resolution matching the requested JSON schema.`,
});

export const solveDoubtFlow = ai.defineFlow(
  {
    name: 'solveDoubtFlow',
    inputSchema: SolveDoubtInputSchema,
    outputSchema: SolveDoubtOutputSchema,
  },
  async (input) => {
    const { output } = await solveDoubtPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate a pedagogical response.');
    }
    return output;
  }
);

export async function solveDoubt(input: SolveDoubtInput): Promise<SolveDoubtOutput> {
  try {
    return await solveDoubtFlow(input);
  } catch (error) {
    console.error("❌ Error in solveDoubt Server Action:", error);
    throw error;
  }
}

