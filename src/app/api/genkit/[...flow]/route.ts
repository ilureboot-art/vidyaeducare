'use server';
import { createApiHandler } from '@genkit-ai/next/server';
import { ai } from '@/ai/genkit';

export const { GET, POST } = createApiHandler({
  ai,
});
