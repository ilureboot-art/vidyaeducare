
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
  studyMaterial: z.string().describe("The raw text of the study material or a data URI of a file. Data URI format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type VidyaEdurankInput = z.infer<typeof VidyaEdurankInputSchema>;

// Define a new schema for the prompt that includes our helper flag.
const VidyaEdurankPromptSchema = VidyaEdurankInputSchema.extend({
  isDataUri: z.boolean()
});


const MCQQuestionSchema = z.object({
  text: z.object({
    en: z.string().describe("The English version of the question text."),
    mr: z.string().describe("The Marathi version of the question text."),
  }),
  options: z.object({
    en: z.array(z.string()).describe("The English versions of the multiple choice options."),
    mr: z.array(z.string()).describe("The Marathi versions of the multiple choice options."),
  }),
  correctAnswer: z.object({
    en: z.string().describe("The correct answer in English."),
    mr: z.string().describe("The correct answer in Marathi."),
  }),
}).describe("A single multiple-choice question with bilingual fields.");

const MCQSetSchema = z.object({
    name: z.string().describe("The name of the test set, derived from the topic."),
    board: z.string().describe("The curriculum board for the test set."),
    standard: z.string().describe("The grade/standard for the test set."),
    subject: z.string().describe("The subject of the test set."),
    questions: z.array(MCQQuestionSchema).describe("An array of question objects."),
}).describe("A complete set of Multiple Choice Questions in a structured JSON format.");


const VidyaEdurankOutputSchema = z.object({
  chapterName: z.string().optional(),
  summaryNotes: z.string().optional().describe('Concept-wise summary notes in bullet points or short paragraphs.'),
  mcqs: MCQSetSchema.optional().describe('A structured JSON object containing the Multiple Choice Questions.'),
  questionPaper: z.string().optional().describe('A structured question paper with marks distribution.'),
  animationScript: z.string().optional().describe('An explanation script suitable for generating a study animation video.'),
  studyPlan: z.string().optional().describe('A suggested study plan or learning goals.'),
  eli5: z.string().optional().describe("A very simple explanation of the content, as if for a 5-year-old."),
  glossary: z.string().optional().describe("A list of important keywords and their definitions from the text."),
});
export type VidyaEdurankOutput = z.infer<typeof VidyaEdurankOutputSchema>;

const vidyaEdurankPrompt = ai.definePrompt({
    name: "vidyaEdurankPrompt",
    input: { schema: VidyaEdurankPromptSchema },
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
{{#if isDataUri}}
{{media url=studyMaterial}}
{{else}}
{{{studyMaterial}}}
{{/if}}
---

Based on the material, please generate the following outputs as requested. The chapter name should be derived from the 'topic' input. For any plain text outputs, format them cleanly using Markdown with clear headings (e.g., "📝 Summary Notes:", "📄 Question Paper:").

{{#if outputs.notes}}
- **Summary Notes**: Create concept-wise summary notes using bullet points or short paragraphs. The language should be clear, concise, and appropriate for a {{{grade}}} grade student.
{{/if}}
{{#if outputs.mcqs}}
- **MCQs**: Generate a complete JSON object for a test set. 
  - The JSON object **MUST** have the following top-level keys: "name", "board", "standard", "subject", and "questions".
  - Populate these metadata fields using the user's input:
    - "name": Use the 'topic' input (e.g., "{{{topic}}}").
    - "board": Use the 'curriculum' input (e.g., "{{{curriculum}}}").
    - "standard": Use the 'grade' input (e.g., "{{{grade}}}").
    - "subject": Use the 'subject' input (e.g., "{{{subject}}}").
  - The "questions" key **MUST** contain an array of exactly {{{mcqCount}}} question objects.
  - Each question object must have three keys: "text", "options", and "correctAnswer".
  - Each of these keys must have two sub-keys: "en" for English and "mr" for Marathi.
  - The "options" sub-keys should contain an array of 4 string options.
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
    // Determine if the input is a data URI and create the prompt input object.
    const promptInput = {
      ...input,
      isDataUri: input.studyMaterial.startsWith('data:'),
    };
    const { output } = await vidyaEdurankPrompt(promptInput);
    return output || {};
  }
);


export async function generateEducationalContent(input: VidyaEdurankInput): Promise<VidyaEdurankOutput> {
    return await vidyaEdurankFlow(input);
}
