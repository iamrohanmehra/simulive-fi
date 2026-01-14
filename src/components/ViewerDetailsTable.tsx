import { useState } from 'react';
import { ArrowUpDown, Download, Trophy } from 'lucide-react';
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
}



type SortField = 'duration' | 'joinedAt';

export default function ViewerDetailsTable({ viewers, sessionDuration, sessionId }: ViewerDetailsTableProps) {
  const [sortField, setSortField] = useState<SortField>('duration');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const getViewerDuration = (viewer: ViewerSession) => {
    const joined = viewer.joinedAt ? new Date(viewer.joinedAt).getTime() : Date.now();
    const left = viewer.leftAt ? new Date(viewer.leftAt).getTime() : Date.now();
    return (left - joined) / 1000;
  };

  const sortedViewers = [...viewers].sort((a, b) => {
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

  // Identify top 3 viewers based on duration
  const topViewers = [...viewers]
    .sort((a, b) => getViewerDuration(b) - getViewerDuration(a))
    .slice(0, 3)
    .map(v => v.id);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Viewer Details</CardTitle>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
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
  );
}
