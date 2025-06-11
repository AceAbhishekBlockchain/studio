// src/ai/flows/select-analysis-tools.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow that automatically selects the most relevant analysis tools using generative AI
 * based on the smart contract code provided as input.
 *
 * - selectAnalysisTools - A function that takes smart contract code as input and returns a list of analysis tools.
 * - SelectAnalysisToolsInput - The input type for the selectAnalysisTools function.
 * - SelectAnalysisToolsOutput - The return type for the selectAnalysisTools function, listing the selected analysis tools.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SelectAnalysisToolsInputSchema = z.object({
  smartContractCode: z.string().describe('The smart contract code to be analyzed.'),
});
export type SelectAnalysisToolsInput = z.infer<typeof SelectAnalysisToolsInputSchema>;

const SelectAnalysisToolsOutputSchema = z.object({
  selectedTools: z.array(z.string()).describe('A list of names of the selected analysis tools.'),
});
export type SelectAnalysisToolsOutput = z.infer<typeof SelectAnalysisToolsOutputSchema>;

export async function selectAnalysisTools(input: SelectAnalysisToolsInput): Promise<SelectAnalysisToolsOutput> {
  return selectAnalysisToolsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'selectAnalysisToolsPrompt',
  input: {
    schema: SelectAnalysisToolsInputSchema,
  },
  output: {
    schema: SelectAnalysisToolsOutputSchema,
  },
  prompt: `Given the following smart contract code, please select the most relevant analysis tools to use for vulnerability detection. Available tools:

  - Slither
  - Mythril
  - Oyente
  - Manticore
  - Echidna

  Smart Contract Code:
  \`\`\`
  {{{smartContractCode}}}
  \`\`\`

  Please return a JSON object with a "selectedTools" field containing a list of the names of the selected tools.
`,
});

const selectAnalysisToolsFlow = ai.defineFlow(
  {
    name: 'selectAnalysisToolsFlow',
    inputSchema: SelectAnalysisToolsInputSchema,
    outputSchema: SelectAnalysisToolsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

