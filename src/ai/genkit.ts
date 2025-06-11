'use server';
/**
 * @fileOverview Initializes the Genkit AI instance with necessary plugins and configurations.
 * This file configures the connection to Google AI services using an API key
 * and sets a default model for generative tasks.
 *
 * - ai: The configured Genkit instance.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!geminiApiKey) {
  const errorMessage = "AuditLens Critical Error: The GEMINI_API_KEY (or GOOGLE_API_KEY) environment variable is not set. " +
                       "Please ensure it is defined in your .env file at the project root (e.g., GEMINI_API_KEY=your_api_key_here) " +
                       "and that your Next.js server has been restarted after adding/changing it.";
  console.error(errorMessage);
  // Throwing an error here will stop the application from trying to initialize Genkit without a key.
  throw new Error(errorMessage);
}

export async function initializeGenkit() {
  return genkit({
    plugins: [
      googleAI({
        apiKey: geminiApiKey,
      }),
    ],
    model: 'googleai/gemini-2.0-flash',
  });
}
