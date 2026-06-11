
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Global Genkit initialization.
 * Configured for Google AI using the stable production-ready flash model.
 * Bridge: Connects Firebase Studio code to Google AI Studio intelligence via GEMINI_API_KEY.
 */

export const ai = genkit({
  plugins: [
    googleAI({
      // Prioritize GEMINI_API_KEY from App Hosting secrets, with fallbacks for local dev
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY,
    }),
  ],
  // Standardize on the latest flash alias for optimal balance of speed, accuracy, and reliability
  model: googleAI.model('gemini-flash-latest'),
});

export { z } from 'genkit';
