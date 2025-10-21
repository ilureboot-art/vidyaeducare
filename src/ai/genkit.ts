import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// By defining the model within the googleAI plugin, we specify which model
// this instance of genkit will use by default for its generation tasks.
export const ai = genkit({
  plugins: [googleAI({
    model: 'gemini-1.5-flash',
  })],
});
