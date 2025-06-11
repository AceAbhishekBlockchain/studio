
'use server';

import { selectAnalysisTools, type SelectAnalysisToolsOutput } from '@/ai/flows/select-analysis-tools';
import { generateVulnerabilityReport, type GenerateVulnerabilityReportOutput, type Vulnerability } from '@/ai/flows/generate-vulnerability-report';
import { z } from 'zod';

// Re-export Vulnerability type for use in page components
export type { Vulnerability } from '@/ai/flows/generate-vulnerability-report';

// Define the structure for the full analysis data
export type FullAnalysisData = {
  selectedTools: string[];
  vulnerabilities: Vulnerability[];
};

// Updated AnalysisResult type
export type AnalysisResult = 
  | { success: true; data: FullAnalysisData; contractIdentifier: string }
  | { success: false; error: string; contractIdentifier: string | null };

// Schema for basic Ethereum address validation
const EthereumAddressSchema = z.string().regex(/^(0x)?[0-9a-fA-F]{40}$/, "Invalid Ethereum address format.");
const ContractUrlSchema = z.string().url("Invalid URL format.");

interface EtherscanSourceCodeResponse {
  status: string; // "1" for success, "0" for error
  message: string;
  result: Array<{
    SourceCode: string | ''; // Can be a single string or a JSON string of sources if multiple files, or empty if not verified
    ABI: string;
    ContractName: string;
    CompilerVersion: string;
    OptimizationUsed: string;
    Runs: string;
    ConstructorArguments: string;
    EVMVersion: string;
    Library: string;
    LicenseType: string;
    Proxy: string; // "0" or "1"
    Implementation: string;
    SwarmSource: string;
  }>;
}

async function fetchContractCodeFromEtherscan(address: string): Promise<string> {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey || apiKey === 'YOUR_ETHERSCAN_API_KEY_HERE' || apiKey.trim() === '') {
    throw new Error('ETHERSCAN_API_KEY is not set in .env file. Please obtain one from https://etherscan.io/myapikey and add it.');
  }

  const etherscanApiUrl = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;

  const response = await fetch(etherscanApiUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch contract code from Etherscan API: ${response.statusText}`);
  }

  const data: EtherscanSourceCodeResponse = await response.json();

  if (data.status === "0") {
    // Etherscan API specific error (e.g., invalid address, rate limit)
    if (data.message === 'NOTOK' && data.result.includes('Max rate limit reached')) {
        throw new Error('Etherscan API rate limit reached. Please try again later or check your API key plan.');
    }
    throw new Error(`Etherscan API error for address ${address}: ${data.message} - ${data.result}`);
  }

  if (!data.result || data.result.length === 0 || !data.result[0].SourceCode) {
    throw new Error(`Contract source code not found or not verified on Etherscan for address: ${address}`);
  }

  let sourceCode = data.result[0].SourceCode;

  // Etherscan returns source code for multi-file contracts as a JSON string
  // that itself contains a JSON object. It looks like: "{{ ...sources... }}"
  if (sourceCode.startsWith('{{') && sourceCode.endsWith('}}')) {
    try {
      // Remove the outer braces and parse the inner JSON
      const sourceCodeObject = JSON.parse(sourceCode.substring(1, sourceCode.length - 1));
      if (sourceCodeObject.sources && typeof sourceCodeObject.sources === 'object') {
        // Concatenate content of all source files
        sourceCode = Object.values(sourceCodeObject.sources)
          .map((file: any) => file.content)
          .join('\n\n// ---- Next File ----\n\n');
      } else if (typeof sourceCodeObject === 'object' && !sourceCodeObject.sources) {
        // Sometimes it's just a map of filename to {content: "..."}
         sourceCode = Object.values(sourceCodeObject)
          .map((file: any) => file.content)
          .join('\n\n// ---- Next File ----\n\n');
      }
      // If it's still not what we expect, we might fall through and use the raw string,
      // or the LLM might struggle. This parsing is a best-effort for common Etherscan formats.
    } catch (e) {
      // If parsing fails, use the raw SourceCode string; it might be a single file string incorrectly wrapped or some other format
      console.warn(`Failed to parse multi-file source code JSON for ${address}, using raw source. Error: ${e}`);
    }
  } else if (sourceCode.startsWith('{') && sourceCode.endsWith('}')) {
     // Some contracts might be a single JSON object for sources (without the double curly braces)
    try {
        const sourceCodeObject = JSON.parse(sourceCode);
        if (sourceCodeObject.sources && typeof sourceCodeObject.sources === 'object') {
             sourceCode = Object.values(sourceCodeObject.sources)
            .map((file: any) => file.content)
            .join('\n\n// ---- Next File ----\n\n');
        } else if (sourceCodeObject.language === "Solidity" && typeof sourceCodeObject.sources === 'object') {
            // Standard JSON Input for Solidity
            sourceCode = Object.values(sourceCodeObject.sources)
                .map((fileEntry: any) => fileEntry.content)
                .join('\n\n// ---- Next File ----\n\n');
        }
        // else, use the raw string if it's not a recognized multi-file format
    } catch (e) {
        console.warn(`Failed to parse potential JSON source code for ${address}, using raw source. Error: ${e}`);
    }
  }


  if (!sourceCode.trim()) {
    throw new Error(`Fetched contract code is empty for address: ${address}. It might be an unverified proxy or an empty contract.`);
  }

  return sourceCode;
}


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
      smartContractCode = await fetchContractCodeFromEtherscan(contractIdentifier);
    } else {
      return { success: false, error: 'Invalid input type selected.', contractIdentifier: null };
    }

    if (!smartContractCode.trim()) {
        throw new Error('Fetched or provided contract code is empty.');
    }

    // Step 1: Call the AI flow to select analysis tools
    const toolSelectionOutput: SelectAnalysisToolsOutput = await selectAnalysisTools({ smartContractCode });

    if (!toolSelectionOutput || !toolSelectionOutput.selectedTools) {
        throw new Error('AI tool selection failed or returned no tools.');
    }
    
    // Step 2: Call the AI flow to generate vulnerability report
    const vulnerabilityReportOutput: GenerateVulnerabilityReportOutput = await generateVulnerabilityReport({
      smartContractCode,
      selectedTools: toolSelectionOutput.selectedTools,
    });

    if (!vulnerabilityReportOutput || !vulnerabilityReportOutput.vulnerabilities) {
        // Even an empty array is a valid response, but null/undefined output is an error.
        throw new Error('AI vulnerability report generation failed.');
    }
    
    return { 
      success: true, 
      data: {
        selectedTools: toolSelectionOutput.selectedTools,
        vulnerabilities: vulnerabilityReportOutput.vulnerabilities,
      }, 
      contractIdentifier: contractIdentifier as string 
    };

  } catch (err) {
    console.error('Error analyzing contract:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis.';
    return { success: false, error: errorMessage, contractIdentifier };
  }
}
