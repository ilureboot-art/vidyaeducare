// 'use server';
/**
 * @fileOverview NumberAce AI hint flow.
 *
 * - getHint - A function that provides a 'higher' or 'lower' hint based on the player's guess.
 * - GetHintInput - The input type for the getHint function.
 * - GetHintOutput - The return type for the getHint function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetHintInputSchema = z.object({
  secretNumber: z.number().describe('The secret number the player is trying to guess, between 1 and 100.'),
  guess: z.number().describe('The player\'s current guess.'),
});
export type GetHintInput = z.infer<typeof GetHintInputSchema>;

const GetHintOutputSchema = z.object({
  hint: z.string().describe('A hint to the player, either "higher" or "lower".'),
});
export type GetHintOutput = z.infer<typeof GetHintOutputSchema>;

export async function getHint(input: GetHintInput): Promise<GetHintOutput> {
  return getHintFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getHintPrompt',
  input: {schema: GetHintInputSchema},
  output: {schema: GetHintOutputSchema},
  prompt: `You are the NumberAce game AI. The player is trying to guess a secret number between 1 and 100. Your job is to provide a helpful hint, telling them whether to guess higher or lower. Generate ONLY the string "higher" or the string "lower" depending on whether the player should guess higher or lower. Do not add any additional text.

Secret Number: {{{secretNumber}}}
Player's Guess: {{{guess}}}`,
});

const getHintFlow = ai.defineFlow(
  {
    name: 'getHintFlow',
    inputSchema: GetHintInputSchema,
    outputSchema: GetHintOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
