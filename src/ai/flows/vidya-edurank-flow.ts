
'use server';
/**
 * @fileOverview The Vidya EduCare AI agent for generating educational content.
 *
 * - generateEducationalContent - The main function to generate content based on user input.
 * - VidyaEdurankInput - The input type for the agent.
 * - VidyaEdurankOutput - The output type for the agent.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const VidyaEdurankInputSchema = z.object({
  language: z.string().describe('The input language (e.g., English, Marathi, Hindi).'),
  grade: z.string().describe('The target grade for the content (e.g., 6th, 10th).'),
  subject: z.string().describe('The subject of the study material (e.g., Science, Mathematics).'),
  topic: z.string().describe('The topic or chapter name.'),
  curriculum: z.string().describe('The curriculum board (e.g., SSC Maharashtra, CBSE, ICSE).'),
  mcqCount: z.number().optional().default(10).describe('The number of MCQs to generate.'),
  outputs: z.object({
    notes: z.boolean(),
    mcqs: z.boolean(),
    questionPaper: z.boolean(),
    animationScript: z.boolean(),
    studyPlan: z.boolean(),
    eli5: z.boolean().describe("Generate an 'Explain Like I'm 5' version of the content."),
    glossary: z.boolean().describe("Generate a glossary of key terms."),
  }),
  studyMaterial: z.string().describe("The raw text of the study material."),
  studyMaterialImages: z.array(z.string()).optional().describe("An optional array of study material images, each as a data URI."),
});
export type VidyaEdurankInput = z.infer<typeof VidyaEdurankInputSchema>;

const VidyaEdurankOutputSchema = z.object({
  chapterName: z.string().optional(),
  summaryNotes: z.string().optional().describe('Concept-wise summary notes in bullet points or short paragraphs.'),
  mcqs: z.string().optional().describe('A plain text list of multiple choice questions, each with 4 options and a correct answer.'),
  questionPaper: z.string().optional().describe('A structured question paper with marks distribution.'),
  animationScript: z.string().optional().describe('An explanation script suitable for generating a study animation video.'),
  studyPlan: z.string().optional().describe('A suggested study plan or learning goals.'),
  eli5: z.string().optional().describe("A very simple explanation of the content, as if for a 5-year-old."),
  glossary: z.string().optional().describe("A list of important keywords and their definitions from the text."),
}).optional();
export type VidyaEdurankOutput = z.infer<typeof VidyaEdurankOutputSchema>;

const vidyaEdurankPrompt = ai.definePrompt({
    name: "vidyaEdurankPrompt",
    input: { schema: VidyaEdurankInputSchema },
    output: { schema: VidyaEdurankOutputSchema },
    prompt: `You are the Vidya EduCare AI Agent, a highly intelligent, multilingual AI assistant. Your job is to understand the provided study material (text and/or images) and generate the specific educational content requested.

Here are the user's specifications:
- Input Language: {{{language}}}
- Target Grade: {{{grade}}}
- Subject: {{{subject}}}
- Topic/Chapter: {{{topic}}}
- Curriculum: {{{curriculum}}}

Here is the study material you need to process:
---
{{#if studyMaterial}}
**Text Content:**
{{{studyMaterial}}}
{{/if}}

{{#if studyMaterialImages}}
**Image Content (in order):**
{{#each studyMaterialImages}}
{{media url=this}}
{{/each}}
{{/if}}
---

Based on the material, please generate the following outputs as requested. The chapter name should be derived from the 'topic' input. Format any plain text outputs with clear Markdown headings.

{{#if outputs.mcqs}}
- **MCQs**: Generate {{{mcqCount}}} multiple-choice questions. Each question needs four lettered options (A, B, C, D) and a clearly stated correct answer. Example:
    1.  What is the capital of France?
        A. London
        B. Paris
        C. Rome
        D. Berlin
    **Answer**: B. Paris
{{/if}}
{{#if outputs.notes}}
- **Summary Notes**: Create concept-wise summary notes in clear, concise language for a {{{grade}}} grade student.
{{/if}}
{{#if outputs.animationScript}}
- **Animation Script**: Write a simple script explaining the core concepts.
{{/if}}
{{#if outputs.eli5}}
- **Explain Like I'm 5**: Provide a very simple explanation of the main topic.
{{/if}}
{{#if outputs.glossary}}
- **Glossary**: Identify 5-10 important keywords and provide brief definitions.
{{/if}}
`
});


const vidyaEdurankFlow = ai.defineFlow(
  {
    name: 'vidyaEdurankFlow',
    inputSchema: VidyaEdurankInputSchema,
    outputSchema: VidyaEdurankOutputSchema,
  },
  async (input) => {
    const result = await vidyaEdurankPrompt(input);
    const output = result.output;
    
    if (!output) {
      console.error("AI model returned a null or empty response object.", { usage: result.usage });
      throw new Error("The AI model returned a null or empty response, indicating a failure to generate content based on the provided material.");
    }
    return output;
  }
);


export async function generateEducationalContent(input: VidyaEdurankInput): Promise<VidyaEdurankOutput> {
    try {
        const result = await vidyaEdurankFlow(input);
        if (result === undefined) {
             throw new Error("Content generation resulted in an undefined output.");
        }
        return result;
    } catch (error) {
        console.error("Error in generateEducationalContent:", error);
        // Re-throw the error to be caught by the client-side caller
        throw error;
    }
}
