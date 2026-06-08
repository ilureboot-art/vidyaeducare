'use server';
/**
 * @fileOverview A flow for generating multiple-choice questions.
 *
 * - generateQuestions - A function that generates MCQs based on a topic.
 * - GenerateQuestionsInput - The input type for the generateQuestions function.
 * - GenerateQuestionsOutput - The return type for the generateQuestions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const GenerateQuestionsInputSchema = z.object({
    topic: z.string().describe('The topic or chapter name to generate questions about.'),
    board: z.string().describe('The educational board (e.g., CBSE, SSC).'),
    standard: z.string().describe('The grade or standard (e.g., 10th).'),
    subject: z.string().describe('The subject (e.g., Science, History).'),
    numQuestions: z.number().describe('The number of questions to generate.'),
});
export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;

const QuestionSchema = z.object({
    id: z.string().describe("A temporary unique ID for the question, like 'temp-1', 'temp-2', etc."),
    text: z.object({
        en: z.string().describe('The question text in English.'),
        mr: z.string().describe('The question text in Marathi.'),
    }),
    options: z.object({
        en: z.array(z.string()).length(4).describe('An array of 4 possible answers in English.'),
        mr: z.array(z.string()).length(4).describe('An array of 4 possible answers in Marathi, corresponding to the English options.'),
    }),
    correctAnswer: z.object({
        en: z.string().describe('The correct answer in English, which must be one of the provided options.'),
        mr: z.string().describe('The correct answer in Marathi, which must be one of the provided options.'),
    }),
});

const GenerateQuestionsOutputSchema = z.object({
  questions: z.array(QuestionSchema),
});
export type GenerateQuestionsOutput = z.infer<typeof GenerateQuestionsOutputSchema>;


export async function generateQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  return generateQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuestionsPrompt',
  model: googleAI.model('gemini-2.5-flash'),
  input: { schema: GenerateQuestionsInputSchema },
  output: { schema: GenerateQuestionsOutputSchema },
  prompt: `You are an expert at creating educational Multiple Choice Questions (MCQs) for the {{{board}}} board, teaching {{{standard}}} {{{subject}}}.

  Generate exactly {{{numQuestions}}} questions for the following topic: {{{topic}}}.

  FOR EACH QUESTION:
  1. Provide the question text in English and Marathi.
  2. Provide exactly four options in English and Marathi.
  3. Ensure Marathi options are accurate translations of English options.
  4. Specify the correct answer from the provided options in both languages.
  5. The 'id' should be a simple string like 'temp-0', 'temp-1'.

  The difficulty level must be appropriate for a {{{standard}}} student.`,
});

const generateQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuestionsFlow',
    inputSchema: GenerateQuestionsInputSchema,
    outputSchema: GenerateQuestionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate questions. The AI model did not return a valid response.');
    }
    // Ensure the output matches the requested number of questions
    output.questions = output.questions.slice(0, input.numQuestions);
    while (output.questions.length < input.numQuestions) {
        output.questions.push({
            id: `temp-${output.questions.length}`,
            text: { en: '', mr: '' },
            options: { en: ['', '', '', ''], mr: ['', '', '', ''] },
            correctAnswer: { en: '', mr: '' }
        });
    }
    return output;
  }
);
