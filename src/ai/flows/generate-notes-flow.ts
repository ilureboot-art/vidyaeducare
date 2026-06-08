
'use server';
/**
 * @fileOverview A flow for generating personalized study notes for students.
 *
 * - generateStudyNotes - A function that creates bilingual notes based on performance, subject, or provided material.
 * - GenerateNotesInput - The input type for the generateStudyNotes function.
 * - GenerateNotesOutput - The return type for the generateStudyNotes function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const GenerateNotesInputSchema = z.object({
    subject: z.string().describe('The academic subject.'),
    standard: z.string().describe('The grade or standard.'),
    board: z.string().describe('The educational board (e.g., SSC, CBSE).'),
    topics: z.array(z.string()).optional().describe('Specific topics to focus on.'),
    performanceContext: z.string().optional().describe('Context from a recent test to personalize notes.'),
    materialDescription: z.string().optional().describe('Text description or raw material from the student.'),
    photoDataUri: z.string().optional().describe("A photo of study material, as a data URI. Format: 'data:<mimetype>;base64,<encoded_data>'."),
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

const prompt = ai.definePrompt({
  name: 'generateStudyNotesPrompt',
  model: googleAI.model('gemini-2.5-flash'),
  input: { schema: GenerateNotesInputSchema },
  output: { schema: GenerateNotesOutputSchema },
  prompt: `You are an expert educational content creator for the {{{board}}} board, teaching {{{standard}}} {{{subject}}}.

  Your task is to generate highly effective, exam-oriented study notes.
  
  {{#if materialDescription}}
  TOPIC/MATERIAL TO SUMMARIZE: {{{materialDescription}}}
  {{/if}}

  {{#if photoDataUri}}
  I have attached a photo of some study material. Please analyze the concepts in this image and include them in the notes: {{media url=photoDataUri}}
  {{/if}}

  {{#if performanceContext}}
  PERSONALIZATION CONTEXT: {{{performanceContext}}} (Focus on explaining these areas clearly).
  {{/if}}
  
  REQUIREMENTS:
  1. Provide a concise, clear title.
  2. Create 3 detailed sections focusing on core concepts.
  3. For EACH section, provide a heading and a clear explanation in BOTH English and Marathi.
  4. For EACH section, provide 3 bullet points (key points) in BOTH languages.
  5. Provide a final pedagogical summary in both languages.
  6. Ensure the Marathi is natural and appropriate for a {{{standard}}} student.
  
  Tone: Educational, clear, and professional.`,
});

export async function generateStudyNotes(input: GenerateNotesInput): Promise<GenerateNotesOutput> {
  const { output } = await prompt(input);
  if (!output) {
    throw new Error('Failed to generate study notes. The AI was unable to process the request.');
  }
  return output;
}
