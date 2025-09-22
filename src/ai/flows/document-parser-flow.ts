
'use server';
/**
 * @fileOverview An AI flow for parsing MCQ test sets from raw document text.
 *
 * - parseQuestionsFromDocument - A function that takes unstructured text and returns a structured array of questions.
 * - QuestionParserInput - The input type for the parser function.
 * - Question[] - The return type for the parser function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { QuestionSchema, QuestionParserInputSchema, type QuestionParserInput } from '../schemas/test-set-schema';

// Define the output schema for the list of questions
const QuestionParserOutputSchema = z.array(QuestionSchema).describe("An array of all the questions extracted from the document.");
export type QuestionParserOutput = z.infer<typeof QuestionParserOutputSchema>;

// Define the schema for the AI's direct output, which is an object containing the questions array.
const AiOutputSchema = z.object({
    questions: QuestionParserOutputSchema,
});


const questionParserPrompt = ai.definePrompt({
    name: "questionParserPrompt",
    input: { schema: QuestionParserInputSchema },
    output: { schema: AiOutputSchema }, // The AI is expected to return an object with a 'questions' property.
    prompt: `You are an expert data extractor. Your task is to parse the following unstructured text and extract every Multiple Choice Question (MCQ) you find into a structured JSON object containing a 'questions' array.

**Extraction Rules:**
1.  **Focus on Questions**: Your primary goal is to extract the 'questions' array. Ignore top-level document details like 'Test Set Name', 'Board', etc. for now.
2.  **Bilingual Parsing**: The document may contain text in both English and Marathi. They can be on the same line separated by a '/' or on separate lines. You must extract both versions for each piece of text. If one language is missing for a field, leave it as an empty string.
3.  **Question Structure**: For each question, you must extract:
    *   'text': The question text itself, in both 'en' and 'mr'.
    *   'options': Exactly 4 options, each with an 'en' and 'mr' version. If an option is missing a language, that specific string can be empty.
    *   'correctAnswer': The correct answer, in both 'en' and 'mr'. The correct answer text **must exactly match** one of the provided options.
4.  **Strictness**: Be very strict. If a question is fundamentally incomplete (e.g., missing the question text, has fewer than 4 options, or has no clear answer), you must ignore it and move to the next one. Do not output incomplete or malformed questions in the final array.
5.  **Output Format**: The final output must be a single, valid JSON object containing only the 'questions' array. Do not add any conversational text, markdown, or other wrappers.

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
    outputSchema: QuestionParserOutputSchema, // The flow itself will return just the array.
  },
  async (input) => {
    // Get the structured output from the AI.
    const result = await questionParserPrompt(input);
    const aiOutput = result.output;

    // Check if the AI returned a valid object with a 'questions' property that is an array.
    if (!aiOutput || !Array.isArray(aiOutput.questions)) {
      throw new Error("The AI model failed to produce a valid questions array.");
    }
    
    // Filter out any potentially incomplete questions the AI might have included.
    // This is a robust way to ensure every item in the final array is valid.
    const validQuestions = aiOutput.questions.filter((q: any): q is z.infer<typeof QuestionSchema> => {
        // Use safeParse on each individual question object.
        // This prevents a single bad object from failing the whole batch.
        const validationResult = QuestionSchema.safeParse(q);
        return validationResult.success;
    });

    if (validQuestions.length === 0) {
        throw new Error("No valid questions could be parsed from the document. Please ensure all questions have text, 4 options, and a clear answer.");
    }

    return validQuestions;
  }
);


export async function parseQuestionsFromDocument(input: QuestionParserInput): Promise<QuestionParserOutput> {
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
