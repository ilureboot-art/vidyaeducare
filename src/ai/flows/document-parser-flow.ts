
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

// Define the output schema for the list of questions only
const QuestionParserOutputSchema = z.array(QuestionSchema).describe("An array of all the questions extracted from the document.");
export type QuestionParserOutput = z.infer<typeof QuestionParserOutputSchema>;


const questionParserPrompt = ai.definePrompt({
    name: "questionParserPrompt",
    input: { schema: QuestionParserInputSchema },
    // IMPORTANT: We do not define an output schema here to prevent Genkit from crashing on
    // partially malformed data. We will validate the raw output manually.
    prompt: `You are an expert data extractor. Your task is to parse the following unstructured text and extract every Multiple Choice Question (MCQ) you find into a structured JSON object.

**Extraction Rules:**
1.  **Focus on Questions**: Your primary goal is to extract the 'questions' array. Ignore top-level document details like 'Test Set Name', 'Board', etc.
2.  **Bilingual Parsing**: The document contains text in both English and Marathi. They can be on the same line separated by a '/' or on separate lines. You must extract both versions for each piece of text.
3.  **Question Structure**: For each question, you must extract:
    *   'text': The question text itself, in both 'en' and 'mr'.
    *   'options': Exactly 4 options, each with an 'en' and 'mr' version.
    *   'correctAnswer': The correct answer, in both 'en' and 'mr'. The correct answer text **must exactly match** one of the provided options.
4.  **Strictness**: Be extremely strict. If a question is incomplete (e.g., missing text, options, or a clear answer), you must ignore it and move to the next one. Do not output incomplete or malformed questions in the array.
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
    outputSchema: QuestionParserOutputSchema,
  },
  async (input) => {
    // Get the raw output from the AI without immediate validation
    const result = await questionParserPrompt(input);
    const rawOutput = result.output as any;

    if (!rawOutput || !Array.isArray(rawOutput.questions)) {
      throw new Error("The AI model failed to produce a valid 'questions' array.");
    }
    
    // Robust filtering step to ensure data integrity before final validation.
    // This will silently skip any incomplete or malformed question objects.
    const validQuestions = rawOutput.questions.filter((q: any): q is z.infer<typeof QuestionSchema> => {
        if (!q) return false;
        
        const textIsValid = q.text && typeof q.text.en === 'string' && q.text.en.trim() !== '' && typeof q.text.mr === 'string' && q.text.mr.trim() !== '';
        const optionsAreValid = q.options && Array.isArray(q.options.en) && Array.isArray(q.options.mr) && q.options.en.length === 4 && q.options.mr.length === 4 && q.options.en.every((opt: any) => typeof opt === 'string' && opt.trim() !== '') && q.options.mr.every((opt: any) => typeof opt === 'string' && opt.trim() !== '');
        const answerIsValid = q.correctAnswer && typeof q.correctAnswer.en === 'string' && q.correctAnswer.en.trim() !== '' && typeof q.correctAnswer.mr === 'string' && q.correctAnswer.mr.trim() !== '';

        if (!textIsValid || !optionsAreValid || !answerIsValid) {
            return false;
        }

        // Final check: ensure the correct answer is one of the provided options
        const answerInOptions = q.options.en.includes(q.correctAnswer.en) && q.options.mr.includes(q.correctAnswer.mr);
        
        return answerInOptions;
    });
    
    // Now, perform a final validation on the cleaned array.
    const finalValidation = QuestionParserOutputSchema.safeParse(validQuestions);

    if (!finalValidation.success) {
        // This error should now rarely happen, but it's a critical safeguard.
        throw new Error(`The processed data is invalid even after filtering. Details: ${finalValidation.error.message}`);
    }

    if (finalValidation.data.length === 0) {
        throw new Error("No valid questions could be parsed from the document. Please ensure all questions have text, 4 options, and a clear answer.");
    }

    return finalValidation.data;
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
