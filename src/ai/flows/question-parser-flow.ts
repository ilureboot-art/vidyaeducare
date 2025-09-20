
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
import { z } from 'zod';

const questionParserPrompt = ai.definePrompt({
  name: "questionParserPrompt",
  input: { schema: QuestionParserInputSchema },
  output: { schema: z.string().describe('A raw JSON string. Do not wrap it in markdown.') },
  prompt: `You are an expert data processor. Your task is to analyze the following unstructured text, which contains a series of multiple-choice questions, and convert it into a structured JSON object that strictly conforms to the provided schema.

The text includes questions, options (A, B, C, D), and correct answers, potentially in both English and Marathi. You must accurately extract all details and format them. Infer the name, board, standard, and subject from the overall content. 

Crucially, ensure that every single question object in the 'questions' array is complete and contains the 'text', 'options', and 'correctAnswer' fields. Each of these must have their 'en' and 'mr' sub-fields populated. The 'options' arrays must have exactly 4 string elements. The 'correctAnswer' must exactly match one of the corresponding options. Do not generate incomplete or empty question objects.

Here is the document text:
---
{{{documentText}}}
---

Now, generate the raw JSON string based on the text.`,
});

const questionParserFlow = ai.defineFlow(
  {
    name: 'questionParserFlow',
    inputSchema: QuestionParserInputSchema,
    outputSchema: TestSetSchema,
  },
  async (input) => {
    const { output: jsonString, usage } = await questionParserPrompt(input);

    if (!jsonString) {
      console.error('AI model returned null or empty string.', { usage });
      throw new Error("The AI model failed to return any content. Please check the document format.");
    }
    
    let parsedOutput;
    try {
        parsedOutput = JSON.parse(jsonString);
    } catch(e) {
        console.error("Failed to parse JSON string from AI:", e);
        throw new Error("The AI returned malformed JSON. Please try again or check the source document.");
    }

    // Validate and clean the parsed output
    const validatedOutput = TestSetSchema.safeParse(parsedOutput);
    
    if (!validatedOutput.success) {
        console.error("AI output failed Zod validation", validatedOutput.error);
         // Even if initial validation fails, try to clean up the questions
    }
    
    const outputWithQuestions = parsedOutput as Partial<TestSetPayload>;

    if (!outputWithQuestions.questions || !Array.isArray(outputWithQuestions.questions)) {
       throw new Error("The AI model's output was missing the 'questions' array.");
    }

    // Strict cleanup step: Filter out any empty or incomplete question objects.
    const cleanedQuestions = outputWithQuestions.questions.filter(q => 
        q && 
        q.text?.en && q.text?.mr &&
        q.options?.en && Array.isArray(q.options.en) && q.options.en.length === 4 && 
        q.options?.mr && Array.isArray(q.options.mr) && q.options.mr.length === 4 &&
        q.correctAnswer?.en && q.correctAnswer?.mr
    );

    return { 
        name: outputWithQuestions.name || 'Untitled Test Set',
        board: outputWithQuestions.board || 'SSC',
        standard: outputWithQuestions.standard || '10th',
        subject: outputWithQuestions.subject || 'General',
        questions: cleanedQuestions 
    };
  }
);

export async function parseQuestionsFromText(input: QuestionParserInput): Promise<TestSetPayload> {
  try {
    const result = await questionParserFlow(input);
    if (!result.questions || result.questions.length === 0) {
        throw new Error("No valid questions could be parsed from the document. Please check the file's formatting and content.");
    }
    return result as TestSetPayload;
  } catch (error) {
    console.error("Error in parseQuestionsFromText:", error);
    // Re-throw a more user-friendly error.
    if (error instanceof Error) {
        throw new Error(`Failed to process the document. Please ensure it's well-formatted. Details: ${error.message}`);
    }
    throw new Error("An unknown error occurred while parsing the document.");
  }
}
