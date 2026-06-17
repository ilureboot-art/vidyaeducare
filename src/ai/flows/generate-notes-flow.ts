
'use server';
/**
 * @fileOverview A flow for generating personalized study notes for students.
 */

import { ai, z } from '@/ai/genkit';

const GenerateNotesInputSchema = z.object({
    subject: z.string().describe('The academic subject.'),
    standard: z.string().optional().describe('The grade or standard.'),
    board: z.string().optional().describe('The educational board (e.g., SSC, CBSE).'),
    topics: z.array(z.string()).optional().describe('Specific topics to focus on.'),
    performanceContext: z.string().optional().describe('Context from a recent test to personalize notes.'),
    materialDescription: z.string().optional().describe('Text description or raw material from the student.'),
    photoDataUri: z.string().optional().describe("A photo of study material, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
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

const generateNotesPrompt = ai.definePrompt({
  name: 'generateStudyNotesPrompt',
  input: { schema: GenerateNotesInputSchema },
  output: { schema: GenerateNotesOutputSchema },
  system: `You are an expert academic content creator for school students in India. 
Your task is to transform complex textbook material into structured, easy-to-read study notes. 
All headings, content, and key points MUST be provided in both English and Marathi. 
Maintain pedagogical accuracy for the specific board and grade level provided.`,
  prompt: `
  Academic Context:
  {{#if board}}Board: {{{board}}}{{/if}}
  {{#if standard}}Grade: {{{standard}}}{{/if}}
  Subject: {{{subject}}}

  Source Data:
  {{#if materialDescription}}Text Content: {{{materialDescription}}}{{/if}}
  {{#if photoDataUri}}Analyze this Textbook Image: {{media url=photoDataUri}}{{/if}}
  {{#if topics}}Primary Topics: {{#each topics}}{{{this}}}, {{/each}}{{/if}}
  {{#if performanceContext}}Personalization Hint: {{{performanceContext}}}{{/if}}

  Task: Generate 3 structured sections with headings, summaries, and key points in both languages.`,
});

export const generateStudyNotesFlow = ai.defineFlow(
  {
    name: 'generateStudyNotesFlow',
    inputSchema: GenerateNotesInputSchema,
    outputSchema: GenerateNotesOutputSchema,
  },
  async (input) => {
    const { output } = await generateNotesPrompt(input);
    if (!output) {
      throw new Error('Failed to generate academic study notes.');
    }
    return output;
  }
);

export async function generateStudyNotes(input: GenerateNotesInput): Promise<GenerateNotesOutput> {
  try {
    return await generateStudyNotesFlow(input);
  } catch (error) {
    console.error("❌ Error in generateStudyNotes Server Action:", error);
    throw error;
  }
}

