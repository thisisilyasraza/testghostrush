import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { GhostLogo } from '@/components/GhostLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ScraperForm } from '@/components/ScraperForm';
import { ResultsTable, ScraperResult } from '@/components/ResultsTable';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { Footer } from '@/components/Footer';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Index = () => {
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ScraperResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, found: 0 });

  const handleStartScrape = useCallback(async (startMc: number, endMc: number) => {
    setIsLoading(true);
    setResults([]);
    const total = endMc - startMc + 1;
    setProgress({ current: 0, total, found: 0 });

    try {
      // Process in batches of 10 for concurrency (10x speed)
      const BATCH_SIZE = 10;
      const scrapedResults: ScraperResult[] = [];

      for (let i = startMc; i <= endMc; i += BATCH_SIZE) {
        const batchEnd = Math.min(i + BATCH_SIZE - 1, endMc);
        const batchMcs: number[] = [];
        for (let mc = i; mc <= batchEnd; mc++) {
          batchMcs.push(mc);
        }

        const { data, error } = await supabase.functions.invoke('scrape-mc', {
          body: { batchMcs }
        });

        if (error) {
          console.error(`Error scraping batch ${i}-${batchEnd}:`, error);
        } else if (data?.success && data.data && Array.isArray(data.data)) {
          // Add each result from the batch
          for (const item of data.data) {
            const freshResult: ScraperResult = {
              mcNumber: item.mcNumber,
              usdot: item.usdot,
              phone: item.phone,
              email: item.email,
              status: item.status,
            };
            scrapedResults.push(freshResult);
          }
        }

        const currentProgress = Math.min(batchEnd - startMc + 1, total);
        setProgress({
          current: currentProgress,
          total,
          found: scrapedResults.length
        });
        
        // Update results in real-time
        setResults([...scrapedResults]);
      }

      toast.success(`Scraping complete! Found ${scrapedResults.length} authorized carriers.`);
    } catch (error) {
      console.error('Scraping error:', error);
      toast.error('An error occurred during scraping');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <GhostLogo />
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </header>

        {/* Scraper Card */}
        <Card className="mb-8 glass-card border-border/50">
          <CardHeader className="pb-4">
            <h2 className="text-lg font-semibold">MC Range Scraper</h2>
            <p className="text-sm text-muted-foreground">
              Enter a range of MC numbers to scrape carrier information from FMCSA
            </p>
          </CardHeader>
          <CardContent>
            <ScraperForm onStart={handleStartScrape} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Progress indicator */}
        {isLoading && (
          <div className="mb-8">
            <ProgressIndicator 
              current={progress.current} 
              total={progress.total} 
              found={progress.found} 
            />
          </div>
        )}

        {/* Results */}
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-4">
            <h2 className="text-lg font-semibold">Results</h2>
          </CardHeader>
          <CardContent>
            <ResultsTable results={results} total={progress.total} />
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
