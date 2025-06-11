import type { SelectAnalysisToolsOutput } from '@/ai/flows/select-analysis-tools';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Lightbulb, PenToolIcon } from 'lucide-react';
import { Separator } from './ui/separator';

type ResultsDashboardProps = {
  results: SelectAnalysisToolsOutput;
  contractUrl: string;
};

// Dummy vulnerability data structure
interface Vulnerability {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  description: string;
  tool: string;
}

// Placeholder: In a real app, this would come from the analysis tools
const DUMMY_VULNERABILITIES: Vulnerability[] = [
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
  },
  {
    id: 'vuln-003',
    title: 'Gas Limit Issues',
    severity: 'Low',
    description: 'Loop in `distributeRewards` could exceed gas limits for a large number of recipients.',
    tool: 'Oyente (Simulated)',
  },
];


const getSeverityBadgeVariant = (severity: Vulnerability['severity']) => {
  switch (severity) {
    case 'Critical':
    case 'High':
      return 'destructive';
    case 'Medium':
      return 'secondary';
    case 'Low':
    case 'Informational':
    default:
      return 'outline';
  }
};

export function ResultsDashboard({ results, contractUrl }: ResultsDashboardProps) {
  const hasVulnerabilities = results.selectedTools.length > 0; // Simulate based on tool selection for now

  return (
    <Card className="mt-8 shadow-lg animate-fadeIn">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Audit Analysis Report</CardTitle>
        <CardDescription>
          Results for contract at: <a href={contractUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{contractUrl}</a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <PenToolIcon className="mr-2 h-5 w-5 text-primary" />
            AI Selected Analysis Tools
          </h3>
          {results.selectedTools.length > 0 ? (
            <ul className="space-y-2">
              {results.selectedTools.map((tool) => (
                <li key={tool} className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="font-medium">{tool}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No specific tools were recommended by the AI for this contract.</p>
          )}
        </section>

        <Separator />
        
        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
            Potential Vulnerabilities (Simulated)
          </h3>
          {hasVulnerabilities ? (
             <div className="space-y-4">
             {DUMMY_VULNERABILITIES.filter(v => results.selectedTools.some(t => v.tool.includes(t))).map((vuln) => (
               <Card key={vuln.id} className="bg-card border-border p-4 rounded-lg shadow">
                 <div className="flex justify-between items-start">
                   <h4 className="font-semibold text-md text-card-foreground">{vuln.title}</h4>
                   <Badge variant={getSeverityBadgeVariant(vuln.severity)}>{vuln.severity}</Badge>
                 </div>
                 <p className="text-sm text-muted-foreground mt-1 mb-2">{vuln.description}</p>
                 <p className="text-xs text-muted-foreground">Detected by: {vuln.tool}</p>
               </Card>
             ))}
             {DUMMY_VULNERABILITIES.filter(v => results.selectedTools.some(t => v.tool.includes(t))).length === 0 && (
                <div className="text-center py-6">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-lg font-medium text-foreground">No simulated vulnerabilities found with selected tools.</p>
                  <p className="text-sm text-muted-foreground">The AI-selected tools did not flag any issues in this simulation.</p>
                </div>
             )}
           </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-medium text-foreground">No vulnerabilities detected (Simulated).</p>
              <p className="text-sm text-muted-foreground">The automated analysis did not find any potential vulnerabilities in this simulation.</p>
            </div>
          )}
        </section>
        
        <Separator />

        <section>
           <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
            Recommendations & Next Steps
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Manually review the contract code, focusing on areas related to the selected tools' strengths.</li>
            <li>Consider using additional static and dynamic analysis tools for comprehensive coverage.</li>
            <li>If complex logic is involved, write extensive unit tests using frameworks like Hardhat or Truffle.</li>
            <li>For critical applications, seek a professional audit from a reputable security firm.</li>
          </ul>
        </section>

      </CardContent>
    </Card>
  );
}
