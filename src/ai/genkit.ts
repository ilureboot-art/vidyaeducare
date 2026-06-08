
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Global Genkit instance configured for Google AI.
 * Explicitly maps GEMINI_API_KEY to ensure compatibility with App Hosting secrets.
 */
export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY }),
  ],
  model: googleAI.model('gemini-2.5-flash'),
});
