
'use server';
/**
 * @fileOverview An AI flow for providing hints in the GuessMaster game.
 *
 * - getAiHint - A function that returns a creative hint.
 * - AiHintInput - The input type for the getAiHint function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiHintInputSchema = z.object({
  guess: z.number().describe('The number the user guessed.'),
  direction: z
    .enum(['higher', 'lower'])
    .describe('The direction of the hint.'),
});
export type AiHintInput = z.infer<typeof AiHintInputSchema>;

export async function getAiHint(input: AiHintInput): Promise<string> {
    const hintFlow = ai.defineFlow(
      {
        name: 'hintFlow',
        inputSchema: AiHintInputSchema,
        outputSchema: z.string(),
      },
      async ({ guess, direction }) => {
        const prompt = `The user is playing a number guessing game. The secret number is ${direction} than their guess of ${guess}. Give them a short, creative, and slightly cryptic hint. Don't mention the words "higher" or "lower". Keep it under 15 words.`;

        const { output } = await ai.generate({
          prompt: prompt,
        });

        return output!;
      }
    );

    return await hintFlow(input);
}

    