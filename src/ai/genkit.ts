import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Global Genkit initialization.
 * Configured for Google AI using stable production models.
 */

export const ai = genkit({
  plugins: [
    googleAI({
      // Ensure the API key is retrieved from the environment variables provided by App Hosting
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY,
    }),
  ],
  // Use the most stable production model identifier for Indian academic tasks
  model: 'googleai/gemini-1.5-flash',
});

export { z } from 'genkit';
