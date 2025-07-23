
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
    eli5: z.boolean().describe("Generate an 'Explain Like I\'m 5' version of the content."),
    glossary: z.boolean().describe("Generate a glossary of key terms."),
  }),
  studyMaterial: z.string().describe("The raw text of the study material or a data URI of a file. Data URI format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type VidyaEdurankInput = z.infer<typeof VidyaEdurankInputSchema>;

const VidyaEdurankOutputSchema = z.object({
  chapterName: z.string().optional(),
  summaryNotes: z.string().optional().describe('Concept-wise summary notes in bullet points or short paragraphs.'),
  mcqs: z.string().optional().describe('Multiple Choice Questions (with 4 options and the correct answer marked).'),
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

Here is the study material you need to process. It could be plain text or an image/document provided as a data URI.
---
{{media url=studyMaterial}}
---

Based on the material, please generate the following outputs as requested. Format your entire response cleanly using Markdown. For each requested section, use a clear heading (e.g., "📝 Summary Notes:", "📚 MCQs:"). The chapter name should be derived from the 'topic' input.

{{#if outputs.notes}}
- **Summary Notes**: Create concept-wise summary notes using bullet points or short paragraphs. The language should be clear, concise, and appropriate for a {{{grade}}} grade student.
{{/if}}
{{#if outputs.mcqs}}
- **MCQs**: Generate a list of exactly {{{mcqCount}}} multiple-choice questions. Each question should have 4 options, and you must indicate the correct answer clearly (e.g., with a "✅" or by bolding it). Ensure questions and options are provided in both English and {{{language}}}.
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
    outputSchema: VidyaEdurankOutputSchema,
  },
  async (input) => {
    const { output } = await vidyaEdurankPrompt(input);
    return output || {};
  }
);


export async function generateEducationalContent(input: VidyaEdurankInput): Promise<VidyaEdurankOutput> {
    return await vidyaEdurankFlow(input);
}
