
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

const hintPrompt = ai.definePrompt({
    name: "hintPrompt",
    input: { schema: AiHintInputSchema },
    output: { schema: z.string().nullable() },
    prompt: `You are a witty and clever game show host for a number guessing game called GuessMaster. The user is trying to guess a secret number. Their last guess was {{{guess}}}. The secret number is actually {{{direction}}} than that.

Give them a short, creative, and fun hint to guide them. Be encouraging and a bit playful.

Here are the rules for your hint:
- **Do not** mention the words "higher", "lower", "up", or "down".
- **Do not** reveal the secret number.
- Keep the hint under 15 words.
- Your personality is charming and slightly mysterious.

Examples:
- If the secret is higher than 25: "You're in the right ballpark, but think a bit grander."
- If the secret is lower than 75: "A little less ambition might be the key!"
- If the secret is higher than 50: "You're past the halfway mark, keep climbing!"
- If the secret is lower than 10: "Think smaller, humbler thoughts."

Now, give a hint for a guess of {{{guess}}} where the answer is {{{direction}}}.`
});


const hintFlow = ai.defineFlow(
  {
    name: 'hintFlow',
    inputSchema: AiHintInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await hintPrompt(input);
    return output || '';
  }
);


export async function getAiHint(input: AiHintInput): Promise<string> {
    return await hintFlow(input);
}
