
/**
 * @fileOverview Zod schemas for the question parsing functionality.
 *
 * - QuestionSchema - The Zod schema for a single parsed question.
 * - TestSetSchema - The Zod schema for a complete test set.
 * - TestSetPayload - The TypeScript type inferred from TestSetSchema.
 * - QuestionParserInputSchema - The Zod schema for the question parser input.
 * - QuestionParserInput - The TypeScript type inferred from QuestionParserInputSchema.
 */

import { z } from 'zod';

export const QuestionSchema = z.object({
  text: z.object({
    en: z.string().describe('The English version of the question text.'),
    mr: z.string().describe('The Marathi version of the question text.'),
  }),
  options: z.object({
    en: z.array(z.string()).length(4).describe('An array of 4 English options.'),
    mr: z.array(z.string()).length(4).describe('An array of 4 Marathi options.'),
  }),
  correctAnswer: z.object({
    en: z.string().describe('The correct English answer, which must exactly match one of the English options.'),
    mr: z.string().describe('The correct Marathi answer, which must exactly match one of the Marathi options.'),
  }),
});

export const TestSetSchema = z.object({
  name: z.string().min(1, "Test set name is required.").describe("A suitable name for the test set, derived from the content (e.g., 'Science Practice Test 1')."),
  board: z.enum(["CBSE", "ICSE", "SSC"]).describe("The educational board (CBSE, ICSE, or SSC), inferred from the content."),
  standard: z.string().min(1, "Standard is required.").describe("The grade or standard (e.g., '10th'), inferred from the content."),
  subject: z.string().min(1, "Subject is required.").describe("The subject (e.g., 'Science'), inferred from the content."),
  questions: z.array(QuestionSchema).describe("An array of all the questions extracted from the document."),
});

export type TestSetPayload = z.infer<typeof TestSetSchema>;

export const QuestionParserInputSchema = z.object({
  documentText: z.string().describe("The unstructured text extracted from a document, containing a list of questions, options, and answers.")
});
export type QuestionParserInput = z.infer<typeof QuestionParserInputSchema>;
