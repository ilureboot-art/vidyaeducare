
'use server';
/**
 * @fileOverview An AI flow for parsing MCQ test sets from raw document text.
 *
 * - parseQuestionsFromDocument - A function that takes unstructured text and returns a structured test set.
 * - QuestionParserInput - The input type for the parser function.
 * - TestSetPayload - The Zod schema-inferred type for the structured test set output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { TestSetSchema, type TestSetPayload, QuestionParserInputSchema, type QuestionParserInput } from '../schemas/test-set-schema';


const questionParserPrompt = ai.definePrompt({
    name: "questionParserPrompt",
    input: { schema: QuestionParserInputSchema },
    output: { schema: TestSetSchema },
    prompt: `You are an expert data extractor. Your task is to parse the following unstructured text from a document and convert it into a structured JSON object representing a test set of Multiple Choice Questions (MCQs).

You must identify the overall details of the test set and then extract each question individually.

**Extraction Rules:**
1.  **Test Set Details**: Identify the 'Test Set Name', 'Board', 'Standard', and 'Subject' from the beginning of the document.
2.  **Bilingual Parsing**: The document contains text in both English and Marathi. They can be on the same line separated by a '/' or on separate lines. You must extract both versions for each piece of text.
3.  **Question Structure**: For each question, you must extract:
    *   'text': The question text itself, in both 'en' and 'mr'.
    *   'options': Exactly 4 options, each with an 'en' and 'mr' version.
    *   'correctAnswer': The correct answer, in both 'en' and 'mr'. The correct answer text **must exactly match** one of the provided options.
4.  **Strictness**: If a question is incomplete (e.g., missing options, no clear answer), you must ignore it and move to the next one. Do not include malformed questions in the output.
5.  **Output Format**: The final output must be a single, valid JSON object conforming to the provided schema. Do not add any conversational text, markdown, or other wrappers around the JSON.
6.  **Final Instruction**: Be extremely strict. If you encounter any data that doesn't fit the structure perfectly, discard that question entirely. Do not output incomplete objects.

**Example Input Text:**
\`\`\`
**Test Set Name:** SSC Science Mock Test
**Board:** SSC
**Standard:** 10th
**Subject:** Science

1. Question Text (English) / (Marathi)
A. Option 1 (English) / (Marathi)
B. Option 2 (English) / (Marathi)
C. Option 3 (English) / (Marathi)
D. Option 4 (English) / (Marathi)
Answer: B. Option 2 (English) / (Marathi)
\`\`\`

**Document Text to Parse:**
---
{{{documentText}}}
---
`
});

const documentParserFlow = ai.defineFlow(
  {
    name: 'documentParserFlow',
    inputSchema: QuestionParserInputSchema,
    outputSchema: TestSetSchema,
  },
  async (input) => {
    const { output } = await questionParserPrompt(input);

    if (!output || !output.questions) {
      throw new Error("The AI model failed to produce a valid output. Please check the document's formatting.");
    }
    
    // Final filtering step to ensure data integrity
    const validQuestions = output.questions.filter((q: any) => 
        q &&
        q.text && q.text.en && q.text.mr &&
        q.options && q.options.en && q.options.mr &&
        q.options.en.length === 4 && q.options.mr.length === 4 &&
        q.correctAnswer && q.correctAnswer.en && q.correctAnswer.mr &&
        q.options.en.every((opt: string) => typeof opt === 'string' && opt.trim() !== '') &&
        q.options.mr.every((opt: string) => typeof opt === 'string' && opt.trim() !== '')
    );

    if (validQuestions.length === 0) {
        throw new Error("No valid questions could be parsed from the document. Please ensure all questions have text, 4 options, and a clear answer.");
    }
    
    const finalResult = { ...output, questions: validQuestions };

    // Final validation against the Zod schema before returning
    const validationResult = TestSetSchema.safeParse(finalResult);
    if (!validationResult.success) {
        console.error("Final validation failed:", validationResult.error.flatten());
        throw new Error(`The processed data is invalid. Details: ${validationResult.error.message}`);
    }

    return validationResult.data;
  }
);


export async function parseQuestionsFromDocument(input: QuestionParserInput): Promise<TestSetPayload> {
    try {
        const result = await documentParserFlow(input);
        if (result === undefined) {
             throw new Error("Content generation resulted in an undefined output.");
        }
        return result;
    } catch (error) {
        console.error("Error in parseQuestionsFromDocument:", error);
        // Re-throw a more user-friendly error.
        if (error instanceof Error) {
            throw new Error(`Failed to process the document. Please ensure it's well-formatted. Details: ${error.message}`);
        }
        throw new Error("An unknown error occurred while parsing the document.");
    }
}
