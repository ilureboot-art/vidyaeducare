
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
});
export type VidyaEdurankOutput = z.infer<typeof VidyaEdurankOutputSchema>;

const vidyaEdurankPrompt = ai.definePrompt({
    name: "vidyaEdurankPrompt",
    input: { schema: VidyaEdurankInputSchema },
    output: { schema: VidyaEdurankOutputSchema },
    prompt: `You are the Vidya EduCare AI Agent, a highly intelligent, multilingual AI assistant for administrators. Your job is to understand the provided study material and generate educational content for the platform based on the admin's request.

Here are the user's specifications:
- Input Language: {{{language}}}
- Target Grade: {{{grade}}}
- Subject: {{{subject}}}
- Topic/Chapter: {{{topic}}}
- Curriculum: {{{curriculum}}}

Here is the study material you need to process:
---
{{{studyMaterial}}}
---

Based on the material, please generate the following outputs as requested. The chapter name should be derived from the 'topic' input. For any plain text outputs, format them cleanly using Markdown with clear headings (e.g., "📝 Summary Notes:", "📄 Question Paper:").

{{#if outputs.mcqs}}
- **MCQs**: Generate a list of {{{mcqCount}}} multiple-choice questions in plain text English format.
  - At the top, include the metadata: Test Name (from topic), Board, Standard, and Subject.
  - Each question must be clearly numbered.
  - Each question must be followed by four lettered options (A, B, C, D).
  - After the options, clearly state the correct answer.
  - **Example Format**:
    1.  What is the capital of France?
        A. London
        B. Paris
        C. Rome
        D. Berlin
    **Answer**: B. Paris
{{/if}}
{{#if outputs.notes}}
- **Summary Notes**: Create concept-wise summary notes using bullet points or short paragraphs. The language should be clear, concise, and appropriate for a {{{grade}}} grade student.
{{/if}}
{{#if outputs.questionPaper}}
- **Question Paper**: Create a structured question paper based on the {{{curriculum}}} board guidelines if possible. Include a variety of question types (e.g., short answer, long answer) and assign marks to each question. The total marks should be reasonable (e.g., 20-25 marks).
{{/if}}
{{#if outputs.animationScript}}
- **Animation Script**: Write a simple, engaging script that explains the core concepts from the material. This script should be suitable for creating a short animated learning video.
{{/if}}
{{#if outputs.studyPlan}}
- **Study Plan**: Suggest a simple, actionable study plan (e.g., a 5-day plan) to help a student master this topic.
{{/if}}
{{#if outputs.eli5}}
- **Explain Like I'm 5**: Provide a very simple, easy-to-understand explanation of the main topic, using simple analogies and avoiding jargon.
{{/if}}
{{#if outputs.glossary}}
- **Glossary / Keywords**: Identify 5-10 important keywords from the text and provide a brief definition for each.
{{/if}}
`
});


const vidyaEdurankFlow = ai.defineFlow(
  {
    name: 'vidyaEdurankFlow',
    inputSchema: VidyaEdurankInputSchema,
    outputSchema: VidyaEdurankOutputSchema.nullable(),
  },
  async (input) => {
    try {
        const { output } = await vidyaEdurankPrompt(input);
        
        // This is a crucial validation step. If the AI returns a response, but it's empty,
        // it means it failed to adhere to the schema. We should treat this as an error.
        if (!output) {
          throw new Error("The AI model returned a null or empty response, indicating a failure to generate content based on the provided material.");
        }
        return output;

    } catch (error) {
        console.error("AI flow 'vidyaEdurankFlow' failed:", error);
        // Return null if the prompt fails or the output is invalid.
        return null;
    }
  }
);


export async function generateEducationalContent(input: VidyaEdurankInput): Promise<VidyaEdurankOutput | null> {
    return await vidyaEdurankFlow(input);
}
