
'use client';

import type { SelectAnalysisToolsOutput } from '@/ai/flows/select-analysis-tools';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

type ReportDownloadButtonProps = {
  results: SelectAnalysisToolsOutput;
  contractIdentifier: string; // Changed from contractUrl
};

export function ReportDownloadButton({ results, contractIdentifier }: ReportDownloadButtonProps) {
  const handleDownload = () => {
    const reportData = {
      contractIdentifier, // Changed from contractUrl
      analysisTimestamp: new Date().toISOString(),
      aiSelectedTools: results.selectedTools,
      // In a real app, you'd include actual vulnerability details here
      simulatedVulnerabilities: [
        {
          id: 'vuln-001',
          title: 'Reentrancy Possibility',
          severity: 'High',
          description: 'A potential reentrancy vulnerability detected in the `withdraw` function. External calls before state updates can lead to exploits.',
          tool: 'Slither (Simulated)',
        },
        {
          id: 'vuln-002',
          title: 'Integer Overflow/Underflow',
          severity: 'Medium',
          description: 'The `transfer` function might be susceptible to integer overflow if extremely large amounts are processed without proper checks.',
          tool: 'Mythril (Simulated)',
        }
      ],
      summary: "This is an automated preliminary analysis. Further manual review and professional auditing are recommended for critical applications."
    };

    const jsonString = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditlens_report_${new Date().toISOString().split('T')[0]}.json`;
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
