'use server';
/**
 * @fileOverview A flow for generating personalized study notes for students.
 *
 * - generateStudyNotes - A function that creates bilingual notes based on performance or subject.
 * - GenerateNotesInput - The input type for the generateStudyNotes function.
 * - GenerateNotesOutput - The return type for the generateStudyNotes function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateNotesInputSchema = z.object({
    subject: z.string().describe('The academic subject.'),
    standard: z.string().describe('The grade or standard.'),
    board: z.string().describe('The educational board (e.g., SSC, CBSE).'),
    topics: z.array(z.string()).optional().describe('Specific topics to focus on.'),
    performanceContext: z.string().optional().describe('Context from a recent test to personalize notes.'),
});
export type GenerateNotesInput = z.infer<typeof GenerateNotesInputSchema>;

const GenerateNotesOutputSchema = z.object({
  title: z.string().describe('A title for the study notes.'),
  sections: z.array(z.object({
    heading: z.object({ en: z.string(), mr: z.string() }),
    content: z.object({ en: z.string(), mr: z.string() }),
    keyPoints: z.array(z.object({ en: z.string(), mr: z.string() })),
  })).describe('Structured sections of study notes.'),
  summary: z.object({ en: z.string(), mr: z.string() }).describe('An overall summary of the material.'),
});
export type GenerateNotesOutput = z.infer<typeof GenerateNotesOutputSchema>;

export async function generateStudyNotes(input: GenerateNotesInput): Promise<GenerateNotesOutput> {
  return generateStudyNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStudyNotesPrompt',
  input: { schema: GenerateNotesInputSchema },
  output: { schema: GenerateNotesOutputSchema },
  prompt: `You are an expert educational content creator and tutor for the {{{board}}} board, teaching {{{standard}}} {{{subject}}}.

  Your task is to generate highly effective, exam-oriented study notes.
  
  {{#if performanceContext}}
  Context: A student recently took a mock test. These notes should prioritize explaining the following topics/mistakes to help them improve: {{{performanceContext}}}
  {{/if}}
  
  {{#if topics}}
  Main Topics to Cover: {{#each topics}}{{{this}}}, {{/each}}
  {{/if}}

  Requirements:
  1. Provide a title for the notes.
  2. Create 3 to 4 sections focusing on core concepts.
  3. For each section, provide a heading and an explanation in BOTH English and Marathi.
  4. For each section, provide 3 bullet points (key points) that are easy to memorize, in BOTH languages.
  5. Provide a final pedagogical summary in both languages.
  6. Ensure the Marathi is natural, academic, and easy for a {{{standard}}} student to understand.
  
  Tone: Encouraging, professional, and clear.`,
});

const generateStudyNotesFlow = ai.defineFlow(
  {
    name: 'generateStudyNotesFlow',
    inputSchema: GenerateNotesInputSchema,
    outputSchema: GenerateNotesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate study notes. The AI was unable to process the request.');
    }
    return output;
  }
);
