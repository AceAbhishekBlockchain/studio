
'use client';

import type { VulnerabilityAnalysisData } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

type ReportDownloadButtonProps = {
  results: VulnerabilityAnalysisData; 
  contractIdentifier: string;
};

export function ReportDownloadButton({ results, contractIdentifier }: ReportDownloadButtonProps) {
  const handleDownload = () => {
    // Ensure results are for vulnerability analysis before trying to access specific fields
    if (!results.selectedTools || !results.vulnerabilities) {
      console.error("Download attempt for non-vulnerability report or malformed data.");
      // Optionally, show a toast or alert to the user
      return;
    }

    const reportData = {
      contractIdentifier,
      analysisTimestamp: new Date().toISOString(),
      aiSelectedTools: results.selectedTools,
      reportedVulnerabilities: results.vulnerabilities,
      summary: "This is an AI-generated preliminary vulnerability analysis. Further manual review and professional auditing are recommended for critical applications."
    };

    const jsonString = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeIdentifier = contractIdentifier.replace(/[^a-zA-Z0-9_.-]/g, '_').substring(0, 50);
    a.download = `aceabhishek_vulnerability_report_${safeIdentifier}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-6 text-center">
      <Button onClick={handleDownload} variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Download Vulnerability Report (JSON)
      </Button>
    </div>
  );
}
