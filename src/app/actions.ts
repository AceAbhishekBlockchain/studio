
'use server';

import { selectAnalysisTools, type SelectAnalysisToolsOutput } from '@/ai/flows/select-analysis-tools';
import { z } from 'zod';

// Updated to reflect different types of identifiers
export type AnalysisResult = 
  | { success: true; data: SelectAnalysisToolsOutput; contractIdentifier: string }
  | { success: false; error: string; contractIdentifier: string | null };

// Schema for basic Ethereum address validation
const EthereumAddressSchema = z.string().regex(/^(0x)?[0-9a-fA-F]{40}$/, "Invalid Ethereum address format.");
const ContractUrlSchema = z.string().url("Invalid URL format.");

export async function analyzeContractAction(
  prevState: any, // Required by useActionState, can be null initially
  formData: FormData
): Promise<AnalysisResult> {
  const inputType = formData.get('inputType') as 'url' | 'file' | 'address';
  let smartContractCode = '';
  let contractIdentifier: string | null = null;

  try {
    if (inputType === 'url') {
      const rawContractUrl = formData.get('contractUrl');
      const validationResult = ContractUrlSchema.safeParse(rawContractUrl);
      if (!validationResult.success) {
        return { success: false, error: 'Invalid URL: ' + validationResult.error.issues.map(i => i.message).join(', '), contractIdentifier: typeof rawContractUrl === 'string' ? rawContractUrl : null };
      }
      contractIdentifier = validationResult.data;
      const response = await fetch(contractIdentifier);
      if (!response.ok) {
        throw new Error(`Failed to fetch contract code from URL: ${response.statusText}`);
      }
      smartContractCode = await response.text();
    } else if (inputType === 'file') {
      const file = formData.get('contractFile') as File | null;
      if (!file) {
        return { success: false, error: 'No file uploaded.', contractIdentifier: null };
      }
      contractIdentifier = file.name;
      if (!file.name.endsWith('.sol')) {
        return { success: false, error: 'Invalid file type. Please upload a .sol file.', contractIdentifier };
      }
      smartContractCode = await file.text();
    } else if (inputType === 'address') {
      const rawContractAddress = formData.get('contractAddress');
      const validationResult = EthereumAddressSchema.safeParse(rawContractAddress);
       if (!validationResult.success) {
        return { success: false, error: 'Invalid Contract Address: ' + validationResult.error.issues.map(i => i.message).join(', '), contractIdentifier: typeof rawContractAddress === 'string' ? rawContractAddress : null };
      }
      contractIdentifier = validationResult.data;
      // Placeholder for fetching code by address
      // In a real scenario, you'd call a service here:
      // smartContractCode = await fetchCodeFromAddress(contractAddress);
      return { success: false, error: `Fetching code for address ${contractIdentifier} is not yet implemented. This feature is coming soon!`, contractIdentifier };
    } else {
      return { success: false, error: 'Invalid input type selected.', contractIdentifier: null };
    }

    if (!smartContractCode.trim()) {
        throw new Error('Fetched or provided contract code is empty.');
    }

    // Call the AI flow to select analysis tools
    const analysisOutput = await selectAnalysisTools({ smartContractCode });

    return { success: true, data: analysisOutput, contractIdentifier: contractIdentifier as string };
  } catch (err) {
    console.error('Error analyzing contract:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis.';
    return { success: false, error: errorMessage, contractIdentifier };
  }
}
