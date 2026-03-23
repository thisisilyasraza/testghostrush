import { Ghost } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProgressIndicatorProps {
  current: number;
  total: number;
  found: number;
}

export function ProgressIndicator({ current, total, found }: ProgressIndicatorProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="space-y-4 p-6 rounded-lg bg-surface-elevated border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ghost className="h-5 w-5 text-primary animate-pulse" />
          <span className="font-medium">Scraping in progress...</span>
        </div>
        <span className="text-sm text-muted-foreground font-mono">
          {current} / {total}
        </span>
      </div>
      
      <Progress value={percentage} className="h-2" />
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Found <span className="text-primary font-semibold">{found}</span> authorized carriers
        </span>
        <span className="text-muted-foreground font-mono">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}
