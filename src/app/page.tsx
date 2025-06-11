
'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

import { Header } from '@/components/Header';
import { CodeSubmissionForm, type CodeSubmissionFormValues } from '@/components/CodeSubmissionForm';
import { ResultsDashboard } from '@/components/ResultsDashboard';
import { ReportDownloadButton } from '@/components/ReportDownloadButton';
import { analyzeContractAction, type AnalysisResult, type VulnerabilityAnalysisData, type TechnologyAnalysisData } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(null);
  const [submittedIdentifier, setSubmittedIdentifier] = React.useState<string | null>(null);
  const [currentAnalysisType, setCurrentAnalysisType] = React.useState<'vulnerability' | 'technology' | null>(null);


  const initialState: AnalysisResult | null = null;
  const [formState, formAction] = useActionState(analyzeContractAction, initialState);

  const handleFormSubmit = (values: CodeSubmissionFormValues) => {
    setIsLoading(true);
    setAnalysisResult(null); 
    setCurrentAnalysisType(null);
    
    const formData = new FormData();
    formData.append('inputType', values.inputType);

    let identifier: string | null = null;

    if (values.inputType === 'url' && values.contractUrl) {
      formData.append('contractUrl', values.contractUrl);
      identifier = values.contractUrl;
      setCurrentAnalysisType('vulnerability');
    } else if (values.inputType === 'file' && values.contractFile && values.contractFile.length > 0) {
      formData.append('contractFile', values.contractFile[0]); 
      identifier = values.contractFile[0].name;
      setCurrentAnalysisType('vulnerability');
    } else if (values.inputType === 'address' && values.contractAddress) {
      formData.append('contractAddress', values.contractAddress);
      identifier = values.contractAddress;
      setCurrentAnalysisType('vulnerability');
    } else if (values.inputType === 'techQuery' && values.techQueryCode) {
      formData.append('techQueryCode', values.techQueryCode);
      identifier = "Pasted Code for Technology Analysis";
      setCurrentAnalysisType('technology');
    }
    setSubmittedIdentifier(identifier);
    
    React.startTransition(() => {
      formAction(formData); 
    });
  };
  
  React.useEffect(() => {
    if (formState) {
      setAnalysisResult(formState);
      setIsLoading(false); 
      if (formState.success) {
        toast({
          title: "Analysis Complete",
          description: `Contract ${formState.type} analysis finished successfully.`,
        });
        setCurrentAnalysisType(formState.type); // Ensure currentAnalysisType is set from formState
      } else {
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: formState.error || "An unknown error occurred.",
        });
        setCurrentAnalysisType(null);
      }
    }
  }, [formState, toast]);


  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        <div className="space-y-8">
          <CodeSubmissionForm onSubmit={handleFormSubmit} isLoading={isLoading} />

          {isLoading && (
            <div className="flex justify-center items-center p-8 rounded-lg shadow-md bg-card">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="ml-4 text-lg text-foreground font-medium">Analyzing your contract... This may take a moment.</p>
            </div>
          )}

          {analysisResult?.success === false && (
             <Alert variant="destructive" className="shadow-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Analysis Error</AlertTitle>
              <AlertDescription>
                {analysisResult.error || 'An unknown error occurred.'}
                {analysisResult.contractIdentifier && <p className="mt-1 text-xs">Source: {analysisResult.contractIdentifier}</p>}
              </AlertDescription>
            </Alert>
          )}

          {analysisResult?.success === true && analysisResult.data && submittedIdentifier && currentAnalysisType && (
            <>
              <ResultsDashboard 
                analysisData={analysisResult.data as VulnerabilityAnalysisData | TechnologyAnalysisData} 
                analysisType={currentAnalysisType}
                contractIdentifier={submittedIdentifier} 
              />
              {currentAnalysisType === 'vulnerability' && (
                <ReportDownloadButton 
                  results={analysisResult.data as VulnerabilityAnalysisData} 
                  contractIdentifier={submittedIdentifier} 
                />
              )}
            </>
          )}
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AceAbhishek. All rights reserved.</p>
        <p>AI-powered smart contract auditing and technology analysis.</p>
      </footer>
    </div>
  );
}
