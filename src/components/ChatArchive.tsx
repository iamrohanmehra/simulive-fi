import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Download, Search, MessageSquare, Filter, X, Pin } from 'lucide-react';
import { getDocs, query, orderBy } from 'firebase/firestore';
import { messagesCollection } from '@/lib/firestore-collections';
import type { Message } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ChatArchiveProps {
  sessionId: string;
}

type MessageFilterType = 'all' | 'user' | 'admin' | 'system' | 'private';
type SortOrder = 'newest' | 'oldest';

export default function ChatArchive({ sessionId }: ChatArchiveProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<MessageFilterType>('all');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  // Debounce Search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        // Default sort by createdAt asc in query, but we handle sort in UI for flexibility
        const q = query(messagesCollection(sessionId), orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);
        const fetchedMessages = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Message));
        setMessages(fetchedMessages);
      } catch (error) {
        console.error("Error fetching chat archive:", error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchMessages();
    }
  }, [sessionId]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== 'all') count++;
    if (pinnedOnly) count++;
    // We don't count search or sort as "filters" usually, but requirement says "12 filters active". 
    // Let's count non-default states.
    return count;
  }, [typeFilter, pinnedOnly]);

  const filteredAndSortedMessages = useMemo(() => {
    let result = messages.filter(msg => {
      // Type Filter
      if (typeFilter !== 'all' && msg.messageType !== typeFilter) return false;

      // Pinned Filter
      if (pinnedOnly && !msg.isPinned) return false;

      // Search Query
      if (debouncedSearch) {
        const queryLower = debouncedSearch.toLowerCase();
        const contentMatch = msg.content.toLowerCase().includes(queryLower);
        const userMatch = msg.userName.toLowerCase().includes(queryLower);
        return contentMatch || userMatch;
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [messages, typeFilter, pinnedOnly, debouncedSearch, sortOrder]);

  const handleDownload = () => {
    const dataStr = JSON.stringify(filteredAndSortedMessages, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `chat-archive-${sessionId}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const clearFilters = () => {
    setTypeFilter('all');
    setPinnedOnly(false);
    setSearchQuery('');
    setSortOrder('newest');
  };

  const getBadGeVariant = (type: string) => {
    switch (type) {
      case 'admin': return 'destructive';
      case 'system': return 'secondary';
      case 'private': return 'outline';
      default: return 'default';
    }
  };

  // Helper to highlight text
  const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight.trim()) {
      return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? <span key={i} className="bg-yellow-200 text-black rounded px-0.5">{part}</span> : part
        )}
      </span>
    );
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <CardTitle>Chat Archive ({messages.length})</CardTitle>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="px-2 py-0.5 text-xs">
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={messages.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export JSON
        </Button>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {/* Filters and Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={typeFilter} onValueChange={(v) => setTypeFilter(v as MessageFilterType)}>
                  <DropdownMenuRadioItem value="all">All Messages</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="user">User</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="admin">Admin</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="private">Private</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                
                <DropdownMenuSeparator />
                
                <div className="p-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="pinned-filter" 
                      checked={pinnedOnly} 
                      onCheckedChange={(c) => setPinnedOnly(!!c)} 
                    />
                    <Label htmlFor="pinned-filter" className="text-sm font-normal">Pinned only</Label>
                  </div>
                </div>

                <DropdownMenuSeparator />
                
                <DropdownMenuLabel>Sort Order</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
                  <DropdownMenuRadioItem value="newest">Newest First</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="oldest">Oldest First</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {(activeFilterCount > 0 || searchQuery) && (
              <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear filters">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Messages list */}
        <ScrollArea className="h-[400px] rounded-md border p-4">
          {loading ? (
            <LoadingSpinner size="md" text="Loading history..." />
          ) : filteredAndSortedMessages.length === 0 ? (
             <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="mb-2 h-8 w-8 opacity-20" />
              <p>No messages found matching criteria.</p>
              {(activeFilterCount > 0 || searchQuery) && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedMessages.map((msg) => (
                <div key={msg.id} className="flex flex-col gap-1 text-sm border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      <HighlightText text={msg.userName} highlight={debouncedSearch} />
                    </span>
                    <Badge variant={getBadGeVariant(msg.messageType)} className="h-5 px-1.5 text-[10px] capitalize">
                      {msg.messageType}
                    </Badge>
                    {msg.isPinned && (
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px] gap-1">
                        <Pin className="h-3 w-3" /> Pinned
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {msg.createdAt && typeof msg.createdAt === 'string' 
                        ? format(new Date(msg.createdAt), 'PP p') 
                        : msg.createdAt && (msg.createdAt as any).toDate 
                          ? format((msg.createdAt as any).toDate(), 'PP p')
                          : ''}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    <HighlightText text={msg.content} highlight={debouncedSearch} />
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
