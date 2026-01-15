import { useState, useMemo } from 'react';
import { ArrowUpDown, Download, Trophy, Printer } from 'lucide-react';
import type { ViewerSession } from '@/lib/types';
import { formatTimestamp, formatDuration } from '@/lib/format-time';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { toast } from 'sonner';

interface ViewerDetailsTableProps {
  viewers: ViewerSession[];
  sessionDuration: number;
  sessionId?: string;
  sessionTitle?: string; // Added for print header
  sessionDate?: Date;    // Added for print header
}



type SortField = 'duration' | 'joinedAt';

export default function ViewerDetailsTable({ viewers, sessionDuration, sessionId, sessionTitle, sessionDate }: ViewerDetailsTableProps) {
  const [sortField, setSortField] = useState<SortField>('duration');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const getViewerDuration = (viewer: ViewerSession) => {
    const joined = viewer.joinedAt ? new Date(viewer.joinedAt).getTime() : Date.now();
    const left = viewer.leftAt ? new Date(viewer.leftAt).getTime() : Date.now();
    return (left - joined) / 1000;
  };

  const sortedViewers = useMemo(() => {
    return [...viewers].sort((a, b) => {
      let aValue = 0;
      let bValue = 0;

      if (sortField === 'duration') {
        aValue = getViewerDuration(a);
        bValue = getViewerDuration(b);
      } else {
        aValue = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
        bValue = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [viewers, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const exportCSV = () => {
    const headers = ['Email/Name', 'Joined At', 'Left At', 'Duration (s)', 'Duration (formatted)', '% Watched'];
    const rows = sortedViewers.map(v => {
      const duration = getViewerDuration(v);
      const percentage = Math.min(100, Math.max(0, sessionDuration > 0 ? (duration / sessionDuration) * 100 : 0));
      
      return [
        v.email || 'Guest',
        v.joinedAt ? formatTimestamp(new Date(v.joinedAt)) : '',
        v.leftAt ? formatTimestamp(new Date(v.leftAt)) : 'Active',
        duration.toFixed(0),
        formatDuration(duration),
        `${percentage.toFixed(0)}%`
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${sessionId || 'unknown'}-viewers.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Viewer details exported to CSV");
  };

  const exportPDF = () => {
    window.print();
  };

  // Identify top 3 viewers based on duration
  const topViewers = [...viewers]
    .sort((a, b) => getViewerDuration(b) - getViewerDuration(a))
    .slice(0, 3)
    .map(v => v.id);

  return (
    <>
      <style>
        {`
          @media print {
            /* Hide everything by default */
            body * {
              visibility: hidden;
            }
            
            /* Show only the print container */
            #print-container, #print-container * {
              visibility: visible;
            }

            /* Reset body position for print */
            #print-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white;
              color: black;
              padding: 20px;
            }

            /* Hide elements meant to be hidden in print */
            .no-print {
              display: none !important;
            }

            /* Styling overrides for print */
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              color: black !important;
            }
            th {
              background-color: #f2f2f2 !important;
              font-weight: bold;
            }
            
            /* Clean up badges and icons */
            .badge-print-clean {
              border: none !important;
              background: none !important;
              color: black !important;
              padding: 0 !important;
            }
            
            /* Typography */
            h1, h2, h3 {
              color: black !important;
            }
          }
        `}
      </style>

      {/* Normal View */}
      <Card className="no-print">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Viewer Details</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportPDF}>
              <Printer className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('joinedAt')}>
                      Joined
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Left At</TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('duration')}>
                      Duration
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[150px]">% Watched</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedViewers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No viewers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedViewers.map((viewer, index) => {
                    const duration = getViewerDuration(viewer);
                    const percentage = Math.min(100, Math.max(0, sessionDuration > 0 ? (duration / sessionDuration) * 100 : 0));
                    const isTopViewer = topViewers.includes(viewer.id);

                    return (
                      <TableRow key={viewer.id}>
                        <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{viewer.email || 'Guest'}</span>
                            {isTopViewer && (
                              <Badge variant="secondary" className="px-1 py-0 text-[10px]">
                                <Trophy className="mr-1 h-3 w-3 text-yellow-500" />
                                Top
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {viewer.joinedAt ? formatTimestamp(new Date(viewer.joinedAt)) : '--'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {viewer.leftAt ? formatTimestamp(new Date(viewer.leftAt)) : <Badge variant="outline" className="text-green-500 border-green-500/50">Active</Badge>}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatDuration(duration)}
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                             <Progress value={percentage} className="h-2 w-[60px]" />
                             <span className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</span>
                           </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Print View (Hidden nicely unless printing) */}
      <div id="print-container" className="hidden print:block space-y-6">
        <div className="text-center border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold mb-2">Session Analytics Report</h1>
          <h2 className="text-xl font-medium mb-1">{sessionTitle || 'Session Report'}</h2>
          <p className="text-sm text-gray-600">
            {sessionDate ? formatTimestamp(sessionDate) : formatTimestamp(new Date())}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 border rounded bg-gray-50">
            <p className="text-sm font-semibold text-gray-500">Total Viewers</p>
            <p className="text-xl font-bold">{viewers.length}</p>
          </div>
          <div className="p-4 border rounded bg-gray-50">
            <p className="text-sm font-semibold text-gray-500">Avg Duration</p>
            <p className="text-xl font-bold">
              {formatDuration(viewers.reduce((acc, v) => acc + getViewerDuration(v), 0) / Math.max(1, viewers.length))}
            </p>
          </div>
          <div className="p-4 border rounded bg-gray-50">
            <p className="text-sm font-semibold text-gray-500">Session Length</p>
            <p className="text-xl font-bold">{formatDuration(sessionDuration)}</p>
          </div>
        </div>

        <h3 className="text-lg font-bold mb-4">Viewer Details</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Joined</th>
              <th>Left</th>
              <th>Duration</th>
              <th>Watched %</th>
            </tr>
          </thead>
          <tbody>
            {sortedViewers.map((viewer, index) => {
              const duration = getViewerDuration(viewer);
              const percentage = Math.min(100, Math.max(0, sessionDuration > 0 ? (duration / sessionDuration) * 100 : 0));
              
              return (
                <tr key={viewer.id}>
                  <td>{index + 1}</td>
                  <td>{viewer.email || 'Guest'}</td>
                  <td>{viewer.joinedAt ? formatTimestamp(new Date(viewer.joinedAt)) : '--'}</td>
                  <td>{viewer.leftAt ? formatTimestamp(new Date(viewer.leftAt)) : 'Active'}</td>
                  <td>{formatDuration(duration)}</td>
                  <td>{percentage.toFixed(0)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-8 text-center text-xs text-gray-400 border-t pt-4">
          Generated via Simulive Platform on {new Date().toLocaleString()}
        </div>
      </div>
    </>
  );
}
