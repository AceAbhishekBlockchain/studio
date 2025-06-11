
import type { VulnerabilityAnalysisData, TechnologyAnalysisData, Vulnerability, TechnologyInfo } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Lightbulb, PenToolIcon, Cpu, FileCode, HelpCircle } from 'lucide-react'; // Added Cpu, FileCode, HelpCircle
import { Separator } from './ui/separator';

type ResultsDashboardProps = {
  analysisData: VulnerabilityAnalysisData | TechnologyAnalysisData;
  analysisType: 'vulnerability' | 'technology';
  contractIdentifier: string;
};

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

const getTechCategoryIcon = (category: TechnologyInfo['category']) => {
  switch (category) {
    case "Programming Language":
      return <FileCode className="mr-2 h-4 w-4 text-blue-500" />;
    case "Standard/Token":
      return <Badge className="mr-2 h-4 w-4 bg-green-500 text-white" >S</Badge>; // Custom simple badge
    case "Framework/Library":
      return <Cpu className="mr-2 h-4 w-4 text-purple-500" />;
    case "Design Pattern":
      return <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />;
    case "Security Feature":
        return <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />;
    default:
      return <HelpCircle className="mr-2 h-4 w-4 text-gray-500" />;
  }
};


export function ResultsDashboard({ analysisData, analysisType, contractIdentifier }: ResultsDashboardProps) {
  const isUrl = contractIdentifier.startsWith('http://') || contractIdentifier.startsWith('https://') || contractIdentifier.startsWith('www.');

  return (
    <Card className="mt-8 shadow-lg animate-fadeIn">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">
          {analysisType === 'vulnerability' ? 'Vulnerability Audit Report' : 'Technology Usage Report'}
        </CardTitle>
        <CardDescription>
          Results for: {isUrl ? (
            <a href={contractIdentifier.startsWith('www.') ? `http://${contractIdentifier}` : contractIdentifier} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{contractIdentifier}</a>
          ) : (
            <span className="break-all">{contractIdentifier}</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {analysisType === 'vulnerability' && (
          <>
            {(analysisData as VulnerabilityAnalysisData).selectedTools && (
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <PenToolIcon className="mr-2 h-5 w-5 text-primary" />
                  AI Selected Analysis Tools
                </h3>
                {(analysisData as VulnerabilityAnalysisData).selectedTools.length > 0 ? (
                  <ul className="space-y-2">
                    {(analysisData as VulnerabilityAnalysisData).selectedTools.map((tool) => (
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
            )}

            <Separator />
            
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
                Potential Vulnerabilities Reported
              </h3>
              {(analysisData as VulnerabilityAnalysisData).vulnerabilities && (analysisData as VulnerabilityAnalysisData).vulnerabilities.length > 0 ? (
                 <div className="space-y-4">
                 {(analysisData as VulnerabilityAnalysisData).vulnerabilities.map((vuln) => (
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
          </>
        )}

        {analysisType === 'technology' && (
          <>
            {(analysisData as TechnologyAnalysisData).identifiedTechnologies && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Cpu className="mr-2 h-5 w-5 text-primary" />
                  Identified Technologies & Usage
                </h3>
                {(analysisData as TechnologyAnalysisData).identifiedTechnologies.length > 0 ? (
                  <div className="space-y-4">
                    {(analysisData as TechnologyAnalysisData).identifiedTechnologies.map((tech) => (
                      <Card key={tech.name} className="bg-card border-border p-4 rounded-lg shadow">
                        <div className="flex items-center mb-2">
                          {getTechCategoryIcon(tech.category)}
                          <h4 className="font-semibold text-md text-card-foreground">{tech.name}</h4>
                          <Badge variant="outline" className="ml-auto text-xs">{tech.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1"><span className="font-medium text-card-foreground">Description:</span> {tech.description}</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap"><span className="font-medium text-card-foreground">Usage in Contract:</span> {tech.usageInContract}</p>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-lg font-medium text-foreground">No specific technologies identified.</p>
                    <p className="text-sm text-muted-foreground">The AI could not clearly identify distinct technologies from the provided code, or the code was too generic.</p>
                  </div>
                )}
              </section>
            )}
            <Separator />
            {(analysisData as TechnologyAnalysisData).overallSummary && (
                 <section>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
                        Overall Summary
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{(analysisData as TechnologyAnalysisData).overallSummary}</p>
                 </section>
            )}
          </>
        )}

      </CardContent>
    </Card>
  );
}
