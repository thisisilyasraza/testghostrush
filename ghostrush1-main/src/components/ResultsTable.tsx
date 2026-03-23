import { Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface ScraperResult {
  mcNumber: number;
  usdot: string;
  phone: string;
  email: string;
  status: string;
}

interface ResultsTableProps {
  results: ScraperResult[];
  total: number;
}

export function ResultsTable({ results, total }: ResultsTableProps) {
  const downloadCSV = () => {
    if (results.length === 0) return;

    // Create CSV content WITHOUT quotes - clean text only
    const headers = ['MC Number', 'USDOT', 'Phone', 'Email', 'Status'];
    
    // Escape function: if a field contains comma, newline, or quote, wrap it in quotes
    // Otherwise, return the plain value
    const escapeField = (field: string | number): string => {
      const str = String(field);
      // If the field contains comma, newline, or double quote, we need to quote it
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        // Escape any internal quotes by doubling them
        return `"${str.replace(/"/g, '""')}"`;
      }
      // Otherwise return the plain value without quotes
      return str;
    };

    const csvContent = [
      headers.join(','),
      ...results.map(r => 
        [
          escapeField(r.mcNumber),
          escapeField(r.usdot),
          escapeField(r.phone),
          escapeField(r.email),
          escapeField(r.status)
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ghostrush_results_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">No results yet</p>
        <p className="text-sm">Start a scrape to see carrier data here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Found <span className="text-primary font-semibold">{results.length}</span> authorized carriers out of {total} checked
        </div>
        <Button
          onClick={downloadCSV}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Download CSV
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">MC Number</TableHead>
                <TableHead className="font-semibold">USDOT</TableHead>
                <TableHead className="font-semibold">Phone</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={`${result.mcNumber}-${index}`} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono font-medium text-primary">
                    {result.mcNumber}
                  </TableCell>
                  <TableCell className="font-mono">
                    {result.usdot}
                  </TableCell>
                  <TableCell className="font-mono">
                    {result.phone}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {result.email}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {result.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
