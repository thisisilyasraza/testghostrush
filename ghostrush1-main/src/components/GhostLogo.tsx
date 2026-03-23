import { Ghost } from 'lucide-react';

export function GhostLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Ghost className="h-10 w-10 text-primary animate-float" />
        <div className="absolute inset-0 blur-lg bg-primary/30 rounded-full" />
      </div>
      <div>
        <h1 className="text-2xl font-bold ghost-text-gradient">GhostRush</h1>
        <p className="text-xs text-muted-foreground font-mono">MC Carrier Scraper</p>
      </div>
    </div>
  );
}
