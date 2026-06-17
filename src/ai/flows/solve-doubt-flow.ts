'use server';
/**
 * @fileOverview A flow for solving student doubts about academic topics or specific MCQs, supporting images.
 * 
 * - solveDoubt - Server action to trigger the pedagogical explanation flow.
 * - SolveDoubtInput - Input schema for doubts, question context, and images.
 * - SolveDoubtOutput - Structured bilingual explanation result.
 */

import { ai, z } from '@/ai/genkit';

const SolveDoubtInputSchema = z.object({
    question: z.object({
        text: z.object({ en: z.string(), mr: z.string() }),
        options: z.object({ en: z.array(z.string()), mr: z.array(z.string()) }),
        correctAnswer: z.object({ en: z.string(), mr: z.string() }),
    }).optional().describe('Optional MCQ context if the doubt is about a specific question.'),
    context: z.object({
        subject: z.string().optional(),
        standard: z.string().optional(),
        board: z.string().optional(),
    }).optional(),
    userDoubt: z.string().describe('The student\'s question or specific doubt.'),
    image: z.string().optional().describe('Optional base64 encoded image string for OCR or visual analysis.'),
});
export type SolveDoubtInput = z.infer<typeof SolveDoubtInputSchema>;

const SolveDoubtOutputSchema = z.object({
  explanation: z.object({
    en: z.string().describe('Clear, pedagogical explanation in English.'),
    mr: z.string().describe('Clear, pedagogical explanation in Marathi.'),
  }),
  keyConcept: z.string().describe('The core scientific or academic concept being addressed.'),
});
export type SolveDoubtOutput = z.infer<typeof SolveDoubtOutputSchema>;

export const solveDoubtFlow = ai.defineFlow(
  {
    name: 'solveDoubtFlow',
    inputSchema: SolveDoubtInputSchema,
    outputSchema: SolveDoubtOutputSchema,
  },
  async (input) => {
    const promptParts: any[] = [];
    
    let promptText = `You are an expert academic tutor specializing in the Indian school curriculum (SSC, CBSE, ICSE). 
Your goal is to provide deep conceptual clarity to students. 
Always provide explanations in both Marathi and English. 
The Marathi explanation should be pedagogical, encouraging, and easy to understand for the student's specified grade level.
The English explanation should be conceptually accurate and academic.
Identify the "Key Concept" (one or two words) that the query relates to.

`;

    if (input.context) {
      promptText += `Context:\n`;
      if (input.context.board) promptText += `Board: ${input.context.board}\n`;
      if (input.context.standard) promptText += `Grade: ${input.context.standard}\n`;
      if (input.context.subject) promptText += `Subject: ${input.context.subject}\n`;
    }

    if (input.question) {
      promptText += `\nSpecific MCQ Being Discussed:
Question (English): ${input.question.text.en}
Question (Marathi): ${input.question.text.mr}
Correct Answer: ${input.question.correctAnswer.en}

Student's Doubt: ${input.userDoubt}\n`;
    } else {
      promptText += `\nStudent's Query: ${input.userDoubt}\n`;
    }

    if (input.image) {
      promptText += `\nAn image has been attached by the student. Please analyze it contextually along with the query.`;
    }

    promptText += `\nPlease provide a detailed bilingual resolution matching the requested JSON schema.`;

    promptParts.push({ text: promptText });

    if (input.image) {
      const match = input.image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        promptParts.push({
          media: {
            url: input.image,
            contentType: match[1],
          }
        });
      } else {
        promptParts.push({
          media: {
            url: input.image,
            contentType: 'image/jpeg',
          }
        });
      }
    }

    const response = await ai.generate({
      prompt: promptParts,
      output: {
        schema: SolveDoubtOutputSchema,
      }
    });

    const output = response.output;
    if (!output) {
      throw new Error('AI failed to generate a pedagogical response.');
    }
    return output;
  }
);

export async function solveDoubt(input: SolveDoubtInput): Promise<SolveDoubtOutput> {
  try {
    return await solveDoubtFlow(input);
  } catch (error) {
    console.error("❌ Error in solveDoubt Server Action:", error);
    throw error;
  }
}
