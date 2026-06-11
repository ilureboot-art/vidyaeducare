'use server';
/**
 * @fileOverview A flow for generating multiple-choice questions.
 */

import { ai, z } from '@/ai/genkit';

const GenerateQuestionsInputSchema = z.object({
    topic: z.string().describe('The topic or chapter name to generate questions about.'),
    board: z.string().describe('The educational board (e.g., CBSE, SSC).'),
    standard: z.string().describe('The grade or standard (e.g., 10th).'),
    subject: z.string().describe('The subject (e.g., Science, History).'),
    numQuestions: z.number().describe('The number of questions to generate.'),
});
export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;

const QuestionSchema = z.object({
    id: z.string().describe("A temporary unique ID for the question, like 'temp-1'."),
    text: z.object({
        en: z.string().describe('The question text in English.'),
        mr: z.string().describe('The question text in Marathi.'),
    }),
    options: z.object({
        en: z.array(z.string()).length(4).describe('4 options in English.'),
        mr: z.array(z.string()).length(4).describe('4 options in Marathi.'),
    }),
    correctAnswer: z.object({
        en: z.string().describe('Correct answer in English.'),
        mr: z.string().describe('Correct answer in Marathi.'),
    }),
});

const GenerateQuestionsOutputSchema = z.object({
  questions: z.array(QuestionSchema),
});
export type GenerateQuestionsOutput = z.infer<typeof GenerateQuestionsOutputSchema>;

const generateQuestionsPrompt = ai.definePrompt({
  name: 'generateQuestionsPrompt',
  input: { schema: GenerateQuestionsInputSchema },
  output: { schema: GenerateQuestionsOutputSchema },
  prompt: `Generate {{{numQuestions}}} MCQs for {{{board}}} Board, {{{standard}}} {{{subject}}} on the topic: {{{topic}}}.
  Each question MUST be in both English and Marathi.
  Provide 4 options per question.
  Ensure accuracy for the curriculum level.

  Response must be valid JSON matching the schema.`,
});

const generateQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuestionsFlow',
    inputSchema: GenerateQuestionsInputSchema,
    outputSchema: GenerateQuestionsOutputSchema,
  },
  async (input) => {
    const { output } = await generateQuestionsPrompt(input);
    if (!output) {
      throw new Error('Failed to generate academic questions.');
    }
    return output;
  }
);

export async function generateQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  return generateQuestionsFlow(input);
}
