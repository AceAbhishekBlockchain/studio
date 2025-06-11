
'use client';

import type { FullAnalysisData } from '@/app/actions'; // Updated import
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

type ReportDownloadButtonProps = {
  results: FullAnalysisData; // Updated to use FullAnalysisData
  contractIdentifier: string;
};

export function ReportDownloadButton({ results, contractIdentifier }: ReportDownloadButtonProps) {
  const handleDownload = () => {
    const reportData = {
      contractIdentifier,
      analysisTimestamp: new Date().toISOString(),
      aiSelectedTools: results.selectedTools,
      reportedVulnerabilities: results.vulnerabilities, // Use real vulnerabilities
      summary: "This is an AI-generated preliminary analysis. Further manual review and professional auditing are recommended for critical applications."
    };

    const jsonString = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Make filename more specific if possible, or keep generic
    const safeIdentifier = contractIdentifier.replace(/[^a-zA-Z0-9_.-]/g, '_').substring(0, 50);
    a.download = `aceabhishek_report_${safeIdentifier}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-6 text-center">
      <Button onClick={handleDownload} variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Download Report (JSON)
      </Button>
    </div>
  );
}
