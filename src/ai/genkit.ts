import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Global Genkit initialization.
 * Configured for Google AI using stable production models and aliases.
 */

export const ai = genkit({
  plugins: [
    googleAI({
      // Prioritize GEMINI_API_KEY from apphosting.yaml or standard Genkit env vars
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY,
    }),
  ],
  // Using the recommended alias for academic and general tasks
  model: googleAI.model('gemini-flash-latest'),
});

export { z } from 'genkit';
