
'use server';
/**
 * @fileOverview An AI flow for parsing unstructured text into a structured TestSet JSON object.
 *
 * - parseQuestionsFromText - A function that takes raw text and returns a TestSet.
 */

import { ai } from '@/ai/genkit';
import {
    QuestionParserInputSchema,
    type QuestionParserInput,
    TestSetSchema,
    type TestSetPayload
} from '@/ai/schemas/test-set-schema';

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
    const { output, usage } = await questionParserPrompt(input);
    if (!output) {
      console.error('AI model returned null output.', { usage });
      throw new Error("The AI model failed to parse the document. The output was empty. This can happen if the document content is unclear or doesn't resemble a test set.");
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
    // Re-throw the original, more specific error from the flow.
    throw error;
  }
}
