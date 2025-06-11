import { ShieldCheck } from 'lucide-react';

export function Header() {
  return (
    <header className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex items-center space-x-3">
        <ShieldCheck className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-headline font-bold text-foreground">
          AuditLens
        </h1>
      </div>
    </header>
  );
}
