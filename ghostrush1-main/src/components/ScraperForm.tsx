import { useState } from 'react';
import { Play, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ScraperFormProps {
  onStart: (startMc: number, endMc: number) => void;
  isLoading: boolean;
}

export function ScraperForm({ onStart, isLoading }: ScraperFormProps) {
  const [startMc, setStartMc] = useState('');
  const [endMc, setEndMc] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const start = parseInt(startMc, 10);
    const end = parseInt(endMc, 10);

    if (isNaN(start) || isNaN(end)) {
      setError('Please enter valid MC numbers');
      return;
    }

    if (start > end) {
      setError('Start MC must be less than or equal to End MC');
      return;
    }

    if (end - start > 1000) {
      setError('Maximum range is 1001 MC numbers at a time');
      return;
    }

    onStart(start, end);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startMc" className="text-sm font-medium">
            Start MC
          </Label>
          <Input
            id="startMc"
            type="number"
            placeholder="Enter Start MC..."
            value={startMc}
            onChange={(e) => setStartMc(e.target.value)}
            className="h-12 bg-surface-elevated border-border focus:border-primary focus:ring-primary font-mono"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endMc" className="text-sm font-medium">
            End MC
          </Label>
          <Input
            id="endMc"
            type="number"
            placeholder="Enter End MC..."
            value={endMc}
            onChange={(e) => setEndMc(e.target.value)}
            className="h-12 bg-surface-elevated border-border focus:border-primary focus:ring-primary font-mono"
            disabled={isLoading}
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={isLoading || !startMc || !endMc}
        className="w-full h-12 ghost-gradient text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Scraping...
          </>
        ) : (
          <>
            <Play className="mr-2 h-5 w-5" />
            Start Scraping
          </>
        )}
      </Button>
    </form>
  );
}
