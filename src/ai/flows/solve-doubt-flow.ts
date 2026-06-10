
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
import { googleAI } from '@genkit-ai/google-genai';

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

const prompt = ai.definePrompt({
  name: 'solveDoubtPrompt',
  model: googleAI.model('gemini-2.5-flash'),
  input: { schema: SolveDoubtInputSchema },
  output: { schema: SolveDoubtOutputSchema },
  prompt: `You are an expert academic tutor. 
  
  {{#if context.board}}Target Board: {{{context.board}}}{{/if}}
  {{#if context.standard}}Target Level: {{{context.standard}}} student{{/if}}

  {{#if question}}
  A student has a doubt about this specific Multiple Choice Question:
  
  QUESTION (English): {{{question.text.en}}}
  QUESTION (Marathi): {{{question.text.mr}}}
  
  CORRECT ANSWER: {{{question.correctAnswer.en}}} ({{{question.correctAnswer.mr}}})

  STUDENT'S SPECIFIC QUERY: "{{{userDoubt}}}"
  {{else}}
  A student is asking a general academic question or expressing a doubt:
  "{{{userDoubt}}}"
  {{/if}}

  Your task:
  1. Provide a clear, step-by-step explanation or answer.
  2. If an MCQ was provided, explain why the correct answer is correct and why the other logic might be confusing.
  3. Ensure the explanation is encouraging and easy to understand.
  4. You MUST provide the explanation in BOTH English and Marathi.
  5. Identify the "Key Concept" involved (e.g., "Photosynthesis", "Newton's First Law").

  Tone: Friendly, academic, and supportive.`,
});

export async function solveDoubt(input: SolveDoubtInput): Promise<SolveDoubtOutput> {
  const { output } = await prompt(input);
  if (!output) {
    throw new Error('The AI tutor was unable to generate an explanation at this time.');
  }
  return output;
}
