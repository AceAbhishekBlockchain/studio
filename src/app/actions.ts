
'use server';

import { selectAnalysisTools, type SelectAnalysisToolsOutput } from '@/ai/flows/select-analysis-tools';
import { generateVulnerabilityReport, type GenerateVulnerabilityReportOutput, type Vulnerability } from '@/ai/flows/generate-vulnerability-report';
import { z } from 'zod';
import { saveAnalysisReport } from '@/lib/mongodb'; // Import the save function

export type { Vulnerability } from '@/ai/flows/generate-vulnerability-report';

export type VulnerabilityAnalysisData = {
  selectedTools: string[];
  vulnerabilities: Vulnerability[];
};

export type AnalysisResult =
  | { success: true; type: 'vulnerability'; data: VulnerabilityAnalysisData; contractIdentifier: string }
  | { success: false; error: string; contractIdentifier: string | null };

const EthereumAddressSchema = z.string().regex(/^(0x)?[0-9a-fA-F]{40}$/, "Invalid Ethereum address format.");
const ContractUrlSchema = z.string().url("Invalid URL format.");

interface EtherscanSourceCodeResponse {
  status: string; 
  message: string;
  result: Array<{
    SourceCode: string | ''; 
    ABI: string;
    ContractName: string;
    CompilerVersion: string;
    OptimizationUsed: string;
    Runs: string;
    ConstructorArguments: string;
    EVMVersion: string;
    Library: string;
    LicenseType: string;
    Proxy: string; 
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
    if (data.message === 'NOTOK' && data.result.includes('Max rate limit reached')) {
        throw new Error('Etherscan API rate limit reached. Please try again later or check your API key plan.');
    }
    throw new Error(`Etherscan API error for address ${address}: ${data.message} - ${data.result}`);
  }

  if (!data.result || data.result.length === 0 || !data.result[0].SourceCode) {
    throw new Error(`Contract source code not found or not verified on Etherscan for address: ${address}`);
  }

  let sourceCode = data.result[0].SourceCode;

  // Handle multi-file JSON format from Etherscan
  if (sourceCode.startsWith('{{') && sourceCode.endsWith('}}')) {
    try {
      // Etherscan sometimes wraps the JSON in double curly braces
      const sourceCodeObject = JSON.parse(sourceCode.substring(1, sourceCode.length - 1));
      if (sourceCodeObject.sources && typeof sourceCodeObject.sources === 'object') {
        // Standard multi-file format
        sourceCode = Object.values(sourceCodeObject.sources)
          .map((file: any) => file.content)
          .join('\\n\\n// ---- Next File ----\\n\\n');
      } else if (typeof sourceCodeObject === 'object' && !sourceCodeObject.sources) {
         // Sometimes the structure is just { "File1.sol": { "content": "..." } }
         sourceCode = Object.values(sourceCodeObject)
          .map((file: any) => file.content)
          .join('\\n\\n// ---- Next File ----\\n\\n');
      }
    } catch (e) {
      console.warn(`Failed to parse multi-file source code JSON for ${address}, using raw source. Error: ${e}`);
      // Fallback to using sourceCode as is if parsing fails
    }
  } else if (sourceCode.startsWith('{') && sourceCode.endsWith('}')) {
    // Handle cases where it's a single JSON object, possibly with a 'sources' key
    try {
        const sourceCodeObject = JSON.parse(sourceCode);
        if (sourceCodeObject.sources && typeof sourceCodeObject.sources === 'object') {
             sourceCode = Object.values(sourceCodeObject.sources)
            .map((file: any) => file.content)
            .join('\\n\\n// ---- Next File ----\\n\\n');
        } else if (sourceCodeObject.language === "Solidity" && typeof sourceCodeObject.sources === 'object') {
            // Another possible structure
            sourceCode = Object.values(sourceCodeObject.sources)
                .map((fileEntry: any) => fileEntry.content)
                .join('\\n\\n// ---- Next File ----\\n\\n');
        }
        // If it's a JSON but not matching known structures, it might be a single file contract wrapped in JSON - use as is.
    } catch (e) {
        // Not a JSON, or a JSON format we don't specifically handle for multi-files - use as is.
        console.warn(`Failed to parse potential JSON source code for ${address}, using raw source. Error: ${e}`);
    }
  }


  if (!sourceCode.trim()) {
    throw new Error(`Fetched contract code is empty for address: ${address}. It might be an unverified proxy or an empty contract.`);
  }

  return sourceCode;
}


export async function analyzeContractAction(
  prevState: any,
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
      if (!file.name.endsWith('.sol') && !file.name.endsWith('.vy')) { 
        return { success: false, error: 'Invalid file type. Please upload a .sol or .vy file.', contractIdentifier };
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

    const toolSelectionOutput: SelectAnalysisToolsOutput = await selectAnalysisTools({ smartContractCode });
    if (!toolSelectionOutput || !toolSelectionOutput.selectedTools) {
        throw new Error('AI tool selection failed or returned no tools.');
    }
    
    const vulnerabilityReportOutput: GenerateVulnerabilityReportOutput = await generateVulnerabilityReport({
      smartContractCode,
      selectedTools: toolSelectionOutput.selectedTools,
    });
    if (!vulnerabilityReportOutput || !vulnerabilityReportOutput.vulnerabilities) {
        throw new Error('AI vulnerability report generation failed.');
    }

    // Save the report to MongoDB - fire and forget for now, or handle errors if critical
    if (contractIdentifier) {
      saveAnalysisReport(
        contractIdentifier,
        toolSelectionOutput.selectedTools,
        vulnerabilityReportOutput.vulnerabilities
      ).catch(dbError => {
        // Log the error but don't let it break the user-facing response
        console.error("Failed to save report to MongoDB:", dbError);
      });
    }
    
    return { 
      success: true, 
      type: 'vulnerability',
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
