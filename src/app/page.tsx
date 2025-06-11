'use client';

import * as React from 'react';
import { useActionState } from 'react'; // Changed from 'react-dom' and renamed
import { z } from 'zod';
import { AlertCircle, Loader2 } from 'lucide-react';

import { Header } from '@/components/Header';
import { CodeSubmissionForm } from '@/components/CodeSubmissionForm';
import { ResultsDashboard } from '@/components/ResultsDashboard';
import { ReportDownloadButton } from '@/components/ReportDownloadButton';
import { analyzeContractAction, type AnalysisResult } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";


const formSchema = z.object({
  contractUrl: z.string().url(),
});

export default function Home() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(null);
  const [submittedUrl, setSubmittedUrl] = React.useState<string | null>(null);


  const initialState: AnalysisResult | null = null;
  // We use a local handler to manage loading state around the form action.
  // The formState from useActionState will reflect the result of the action.
  const [formState, formAction] = useActionState(analyzeContractAction, initialState); // Changed from useFormState

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setAnalysisResult(null); // Clear previous results
    setSubmittedUrl(values.contractUrl);

    const formData = new FormData();
    formData.append('contractUrl', values.contractUrl);
    
    // Directly call formAction, which is `analyzeContractAction` bound with `useActionState`
    // This will update `formState` when the action completes.
    await formAction(formData); 
    // No need to call analyzeContractAction directly here, useActionState handles it.
  };
  
  React.useEffect(() => {
    // When formState updates (after action completes), update local state
    if (formState) {
      setAnalysisResult(formState);
      setIsLoading(false); // Action finished, stop loading
      if (formState.success) {
        toast({
          title: "Analysis Complete",
          description: "Smart contract analysis finished successfully.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: formState.error || "An unknown error occurred.",
        });
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
                {analysisResult.contractUrl && <p className="mt-1 text-xs">URL: {analysisResult.contractUrl}</p>}
              </AlertDescription>
            </Alert>
          )}

          {analysisResult?.success === true && analysisResult.data && submittedUrl && (
            <>
              <ResultsDashboard results={analysisResult.data} contractUrl={submittedUrl} />
              <ReportDownloadButton results={analysisResult.data} contractUrl={submittedUrl} />
            </>
          )}
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AuditLens. All rights reserved.</p>
        <p>AI-powered smart contract auditing.</p>
      </footer>
    </div>
  );
}
