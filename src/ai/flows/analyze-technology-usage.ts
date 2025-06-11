
'use server';
/**
 * @fileOverview This file defines a Genkit flow that analyzes smart contract code
 * to identify technologies used and how they are implemented.
 *
 * - analyzeTechnologyUsage - A function that takes smart contract code and returns a technology usage report.
 * - AnalyzeTechnologyUsageInput - The input type for the function.
 * - AnalyzeTechnologyUsageOutput - The return type for the function.
 * - TechnologyInfo - The type definition for a single identified technology.
 */

import { initializeGenkit } from '@/ai/genkit';
import {z} from 'genkit';

const TechnologyInfoSchema = z.object({
  name: z.string().describe('The name of the identified technology, language, framework, or pattern (e.g., Solidity, ERC-20, OpenZeppelin Ownable).'),
  category: z.enum(["Programming Language", "Standard/Token", "Framework/Library", "Design Pattern", "Security Feature", "Other"]).describe("The category of the technology."),
  description: z.string().describe('A brief description of what this technology is or does in general.'),
  usageInContract: z.string().describe('Specific explanation of how this technology is used or implemented within the provided smart contract code. Mention specific functions or code snippets if relevant.'),
});
export type TechnologyInfo = z.infer<typeof TechnologyInfoSchema>;

const AnalyzeTechnologyUsageInputSchema = z.object({
  smartContractCode: z.string().describe('The smart contract code to be analyzed for technology usage.'),
});
export type AnalyzeTechnologyUsageInput = z.infer<typeof AnalyzeTechnologyUsageInputSchema>;

const AnalyzeTechnologyUsageOutputSchema = z.object({
  identifiedTechnologies: z.array(TechnologyInfoSchema).describe('A list of technologies identified in the smart contract code.'),
  overallSummary: z.string().describe('A brief overall summary of the technology stack and architecture of the smart contract.'),
});
export type AnalyzeTechnologyUsageOutput = z.infer<typeof AnalyzeTechnologyUsageOutputSchema>;

export async function analyzeTechnologyUsage(input: AnalyzeTechnologyUsageInput): Promise<AnalyzeTechnologyUsageOutput> {
  return analyzeTechnologyUsageFlow(input);
}

const genkit = await initializeGenkit();

const prompt = genkit.definePrompt({
  name: 'analyzeTechnologyUsagePrompt',
  input: {
    schema: AnalyzeTechnologyUsageInputSchema,
  },
  output: {
    schema: AnalyzeTechnologyUsageOutputSchema,
  },
  prompt: `You are a smart contract and blockchain technology expert.
Analyze the provided smart contract code to identify the technologies used.
For each identified technology (programming language, specific standards like ERC-20/ERC-721, libraries like OpenZeppelin, design patterns like Ownable or ReentrancyGuard, security features, etc.):
- Provide its name.
- Categorize it (e.g., "Programming Language", "Standard/Token", "Framework/Library", "Design Pattern", "Security Feature", "Other").
- Briefly describe the technology.
- Explain its specific usage and implementation within the provided contract code. Refer to code snippets or functions if applicable.

Finally, provide a concise overall summary of the contract's technology stack and architecture.

Smart Contract Code:
\`\`\`
{{{smartContractCode}}}
\`\`\`

Return your findings as a JSON object with "identifiedTechnologies" (an array) and "overallSummary" fields, as per the defined schema.
If the code is too short or nonsensical to analyze, return an empty "identifiedTechnologies" array and a summary stating that.
`,
});

const analyzeTechnologyUsageFlow = genkit.defineFlow(
  {
    name: 'analyzeTechnologyUsageFlow',
    inputSchema: AnalyzeTechnologyUsageInputSchema,
    outputSchema: AnalyzeTechnologyUsageOutputSchema,
  },
  async input => {
    if (!input.smartContractCode || input.smartContractCode.trim().length < 20) { // Basic check for minimal code
      return {
        identifiedTechnologies: [],
        overallSummary: "The provided code snippet is too short or empty for a meaningful technology analysis."
      };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
