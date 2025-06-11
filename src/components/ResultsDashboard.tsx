
import type { FullAnalysisData, Vulnerability } from '@/app/actions'; // Updated import
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Lightbulb, PenToolIcon } from 'lucide-react';
import { Separator } from './ui/separator';

type ResultsDashboardProps = {
  results: FullAnalysisData; // Updated to use FullAnalysisData
  contractIdentifier: string;
};

// DUMMY_VULNERABILITIES is no longer needed as vulnerabilities come from props.

const getSeverityBadgeVariant = (severity: Vulnerability['severity']) => {
  switch (severity) {
    case 'Critical':
    case 'High':
      return 'destructive';
    case 'Medium':
      return 'secondary'; // Keep secondary for medium, or use 'warning' if you add one
    case 'Low':
    case 'Informational':
    default:
      return 'outline';
  }
};

export function ResultsDashboard({ results, contractIdentifier }: ResultsDashboardProps) {
  const { selectedTools, vulnerabilities } = results;
  const hasVulnerabilities = vulnerabilities && vulnerabilities.length > 0;

  const isUrl = contractIdentifier.startsWith('http://') || contractIdentifier.startsWith('https://');

  return (
    <Card className="mt-8 shadow-lg animate-fadeIn">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Audit Analysis Report</CardTitle>
        <CardDescription>
          Results for contract: {isUrl ? (
            <a href={contractIdentifier} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{contractIdentifier}</a>
          ) : (
            <span className="break-all">{contractIdentifier}</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <PenToolIcon className="mr-2 h-5 w-5 text-primary" />
            AI Selected Analysis Tools
          </h3>
          {selectedTools.length > 0 ? (
            <ul className="space-y-2">
              {selectedTools.map((tool) => (
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
            Potential Vulnerabilities Reported
          </h3>
          {hasVulnerabilities ? (
             <div className="space-y-4">
             {vulnerabilities.map((vuln) => (
               <Card key={vuln.id} className="bg-card border-border p-4 rounded-lg shadow">
                 <div className="flex justify-between items-start">
                   <h4 className="font-semibold text-md text-card-foreground">{vuln.title}</h4>
                   <Badge variant={getSeverityBadgeVariant(vuln.severity)}>{vuln.severity}</Badge>
                 </div>
                 <p className="text-sm text-muted-foreground mt-1 mb-2 whitespace-pre-wrap">{vuln.description}</p>
                 <p className="text-xs text-muted-foreground">Tool Association: {vuln.tool}</p>
               </Card>
             ))}
           </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-medium text-foreground">No potential vulnerabilities reported by the AI.</p>
              <p className="text-sm text-muted-foreground">Based on the selected tools and code analysis, the AI did not identify specific vulnerabilities.</p>
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
            <li>Manually review the contract code, focusing on areas related to the selected tools' strengths and any reported vulnerabilities.</li>
            <li>Consider using additional static and dynamic analysis tools for comprehensive coverage if any doubts remain.</li>
            <li>If complex logic is involved, write extensive unit tests using frameworks like Hardhat or Truffle.</li>
            <li>For critical applications, always seek a professional audit from a reputable security firm, regardless of automated tool findings.</li>
          </ul>
        </section>

      </CardContent>
    </Card>
  );
}
