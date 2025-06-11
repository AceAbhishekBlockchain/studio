
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListTree, Brain, Palette, LayoutGrid, PlugZap, Server, FileCode, ShieldCheck, Database, GitFork } from 'lucide-react';

const technologies = [
  {
    name: 'Next.js (App Router)',
    description: 'A React framework for building full-stack web applications. The App Router is used for server-centric routing, Server Components, and improved performance.',
    role: 'Core application framework, routing, server-side rendering, and API handling via Server Actions.',
    icon: <ListTree className="h-6 w-6 text-primary" />,
  },
  {
    name: 'React',
    description: 'A JavaScript library for building user interfaces. Used for creating reusable UI components and managing application state with hooks like `useActionState`.',
    role: 'Frontend user interface construction and component-based architecture.',
    icon: <LayoutGrid className="h-6 w-6 text-blue-500" />,
  },
  {
    name: 'ShadCN UI',
    description: 'A collection of beautifully designed, accessible, and customizable UI components built on top of Radix UI and Tailwind CSS.',
    role: 'Provides the pre-built UI components like Cards, Buttons, Forms, Tabs, etc., ensuring a consistent and professional look and feel.',
    icon: <Palette className="h-6 w-6 text-pink-500" />,
  },
  {
    name: 'Tailwind CSS',
    description: 'A utility-first CSS framework for rapidly building custom user interfaces. Used for styling all components and layouts.',
    role: 'Styling and visual design of the application, providing fine-grained control over appearance. Theme variables are defined in globals.css.',
    icon: <Palette className="h-6 w-6 text-teal-500" />,
  },
  {
    name: 'Genkit (with Google Gemini)',
    description: 'An open-source framework from Google for building AI-powered features and applications. It simplifies integrating with large language models (LLMs) like Gemini.',
    role: 'Powers the AI-driven smart contract analysis (tool selection, vulnerability generation) by defining and running AI flows that interact with the Gemini model.',
    icon: <Brain className="h-6 w-6 text-purple-500" />,
  },
  {
    name: 'TypeScript',
    description: 'A superset of JavaScript that adds static typing. It helps in building more robust and maintainable code.',
    role: 'Used throughout the project (frontend, backend actions, AI flows) for improved code quality, type safety, and developer experience.',
    icon: <FileCode className="h-6 w-6 text-sky-600" />
  },
  {
    name: 'Zod',
    description: 'A TypeScript-first schema declaration and validation library. Used for validating form inputs and the schemas for AI flow inputs/outputs.',
    role: 'Ensures data integrity for form submissions (e.g., URLs, contract addresses) and the data structures exchanged with Genkit AI flows.',
    icon: <ShieldCheck className="h-6 w-6 text-green-500" />
  },
   {
    name: 'Lucide Icons',
    description: 'A simply beautiful and consistent open-source icon library.',
    role: 'Provides the icons used throughout the application for visual cues and enhanced aesthetics.',
    icon: <PlugZap className="h-6 w-6 text-orange-500" />
  },
  {
    name: 'Etherscan API',
    description: 'An API service that provides access to Ethereum blockchain data, including verified smart contract source code.',
    role: 'Used to fetch smart contract source code when a user provides a contract address for analysis.',
    icon: <Server className="h-6 w-6 text-gray-500" />
  },
  {
    name: 'MongoDB Atlas (with Search and Vector Search)',
    description: 'A fully managed cloud database service with powerful search and vector search capabilities. Integrated to persist smart contract vulnerability analysis reports.',
    role: 'Data storage, persistence, and enhanced search for analysis reports.',
    icon: <Database className="h-6 w-6 text-green-600" />
  },
  {
    name: 'GitLab CI/CD',
    description: 'A continuous integration and continuous delivery/deployment platform built into GitLab.',
    role: 'Automates the build, test, and deployment pipeline. The .gitlab-ci.yml file is configured with stages for dependency installation, building, type checking, linting, and deploying to Firebase App Hosting (manual trigger, requires CI/CD variables).',
    icon: <GitFork className="h-6 w-6 text-orange-600" />
  }
];

export function ProjectTechStackDisplay() {
  return (
    <Card className="shadow-lg border-border bg-card">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-card-foreground">
          Technologies Powering AceAbhishek Smart Contract Auditor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-muted-foreground">
          This application is built using a modern stack of technologies to provide a robust, performant, and AI-enhanced user experience. Here's a breakdown of the key components:
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {technologies.map((tech) => (
            <Card key={tech.name} className="flex flex-col border-border bg-background shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center text-foreground">
                  {tech.icon}
                  <span className="ml-3 font-semibold">{tech.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                <p className="text-sm text-muted-foreground">{tech.description}</p>
                <p className="text-sm">
                  <strong className="font-medium text-foreground">Role in Project:</strong>
                  <span className="text-muted-foreground ml-1">{tech.role}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-sm text-muted-foreground pt-4 border-t border-border mt-6">
          These technologies work in concert, leveraging server components, server actions, and AI flows to deliver the smart contract auditing and analysis capabilities of the AceAbhishek platform. The CI/CD pipeline helps ensure code quality and automates deployments to Firebase App Hosting. MongoDB Atlas is used for data persistence, storing analysis reports.
        </p>
      </CardContent>
    </Card>
  );
}
