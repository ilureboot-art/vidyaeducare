
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Global Genkit initialization.
 * Configured for Google AI using stable production models.
 * Bridge: Connects Firebase Studio code to Google AI Studio intelligence via GEMINI_API_KEY.
 */

export const ai = genkit({
  plugins: [
    googleAI({
      // Ensure the API key is retrieved from the environment variables provided by App Hosting
      // This is the primary bridge between your app code and AI Studio intelligence.
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY,
    }),
  ],
  // Standardize on the production-ready flash model for balanced speed/accuracy
  model: 'googleai/gemini-1.5-flash',
});

export { z } from 'genkit';
