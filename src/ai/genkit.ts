import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Global Genkit initialization.
 * Configured for Google AI using stable production models.
 */

export const ai = genkit({
  plugins: [
    googleAI({
      // Prioritize GEMINI_API_KEY from apphosting.yaml
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  // Setting a stable default model
  model: 'googleai/gemini-1.5-flash',
});
