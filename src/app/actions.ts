'use server';

import { selectAnalysisTools, type SelectAnalysisToolsOutput } from '@/ai/flows/select-analysis-tools';
import { z } from 'zod';

const ContractUrlSchema = z.string().url();

export type AnalysisResult = 
  | { success: true; data: SelectAnalysisToolsOutput; contractUrl: string }
  | { success: false; error: string; contractUrl: string | null };

export async function analyzeContractAction(
  prevState: any, // Required by useFormState, can be null initially
  formData: FormData
): Promise<AnalysisResult> {
  const rawContractUrl = formData.get('contractUrl');

  const validationResult = ContractUrlSchema.safeParse(rawContractUrl);

  if (!validationResult.success) {
    return { success: false, error: 'Invalid URL provided.', contractUrl: typeof rawContractUrl === 'string' ? rawContractUrl : null };
  }
  const contractUrl = validationResult.data;

  try {
    // Fetch smart contract code from the URL
    const response = await fetch(contractUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch contract code: ${response.statusText}`);
    }
    const smartContractCode = await response.text();

    if (!smartContractCode.trim()) {
        throw new Error('Fetched contract code is empty.');
    }

    // Call the AI flow to select analysis tools
    const analysisOutput = await selectAnalysisTools({ smartContractCode });

    return { success: true, data: analysisOutput, contractUrl };
  } catch (err) {
    console.error('Error analyzing contract:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis.';
    return { success: false, error: errorMessage, contractUrl };
  }
}
