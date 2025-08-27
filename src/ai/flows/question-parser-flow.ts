
'use server';
/**
 * @fileOverview An AI flow for parsing unstructured text into a structured TestSet JSON object.
 *
 * - parseQuestionsFromText - A function that takes raw text and returns a TestSet.
 * - QuestionParserInput - The input type for the flow.
 * - TestSetSchema - The Zod schema for the TestSet object.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const QuestionSchema = z.object({
  text: z.object({
    en: z.string().describe('The English version of the question text.'),
    mr: z.string().describe('The Marathi version of the question text.'),
  }),
  options: z.object({
    en: z.array(z.string()).length(4).describe('An array of 4 English options.'),
    mr: z.array(z.string()).length(4).describe('An array of 4 Marathi options.'),
  }),
  correctAnswer: z.object({
    en: z.string().describe('The correct English answer, which must match one of the English options.'),
    mr: z.string().describe('The correct Marathi answer, which must match one of the Marathi options.'),
  }),
});

export const TestSetSchema = z.object({
  name: z.string().describe("A suitable name for the test set, derived from the content (e.g., 'Science Practice Test 1')."),
  board: z.enum(["CBSE", "ICSE", "SSC"]).describe("The educational board, inferred from the content."),
  standard: z.string().describe("The grade or standard (e.g., '10th'), inferred from the content."),
  subject: z.string().describe("The subject (e.g., 'Science'), inferred from the content."),
  questions: z.array(QuestionSchema),
});

export type TestSetPayload = z.infer<typeof TestSetSchema>;

export const QuestionParserInputSchema = z.object({
  documentText: z.string().describe("The unstructured text extracted from a document, containing a list of questions, options, and answers.")
});
export type QuestionParserInput = z.infer<typeof QuestionParserInputSchema>;

const questionParserPrompt = ai.definePrompt({
  name: "questionParserPrompt",
  input: { schema: QuestionParserInputSchema },
  output: { schema: TestSetSchema },
  prompt: `You are an expert data processor. Your task is to analyze the following unstructured text, which contains a series of multiple-choice questions, and convert it into a structured JSON object.

The text includes questions, options (A, B, C, D), and correct answers, potentially in both English and Marathi. You must accurately extract all details and format them according to the provided JSON schema. Infer the name, board, standard, and subject from the overall content. Ensure that the 'correctAnswer' fields exactly match one of the corresponding options.

Here is the document text:
---
{{{documentText}}}
---

Now, generate the structured JSON object.`,
});

const questionParserFlow = ai.defineFlow(
  {
    name: 'questionParserFlow',
    inputSchema: QuestionParserInputSchema,
    outputSchema: TestSetSchema,
  },
  async (input) => {
    const { output } = await questionParserPrompt(input);
    if (!output) {
      throw new Error("The AI model failed to parse the document into a valid test set.");
    }
    return output;
  }
);

export async function parseQuestionsFromText(input: QuestionParserInput): Promise<TestSetPayload> {
  try {
    const result = await questionParserFlow(input);
    return result;
  } catch (error) {
    console.error("Error in parseQuestionsFromText:", error);
    throw new Error("Failed to process the document. Please ensure it's well-formatted and try again.");
  }
}
