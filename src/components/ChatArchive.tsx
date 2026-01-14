import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Download, Search, MessageSquare } from 'lucide-react';
import { getDocs, query, orderBy } from 'firebase/firestore';
import { messagesCollection } from '@/lib/firestore-collections';
import type { Message } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ChatArchiveProps {
  sessionId: string;
}

type FilterType = 'all' | 'user' | 'admin' | 'system';

export default function ChatArchive({ sessionId }: ChatArchiveProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const q = query(messagesCollection(sessionId), orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);
        const fetchedMessages = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
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

  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      // Type Filter
      if (filter !== 'all' && msg.messageType !== filter) return false;

      // Search Query
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        const contentMatch = msg.content.toLowerCase().includes(queryLower);
        const userMatch = msg.userName.toLowerCase().includes(queryLower);
        return contentMatch || userMatch;
      }

      return true;
    });
  }, [messages, filter, searchQuery]);

  const handleDownload = () => {
    const dataStr = JSON.stringify(messages, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `chat-archive-${sessionId}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'admin': return 'destructive'; // Or any other distinct color
      case 'system': return 'secondary';
      case 'private': return 'outline';
      default: return 'default'; // user
    }
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>Chat Archive ({messages.length})</CardTitle>
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={messages.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Download JSON
        </Button>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {/* Filters and Search */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex gap-2">
            {(['all', 'user', 'admin', 'system'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f}
              </Button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Messages list */}
        <ScrollArea className="h-[400px] rounded-md border p-4">
          {loading ? (
            <LoadingSpinner size="md" text="Loading history..." />
          ) : filteredMessages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="mb-2 h-8 w-8 opacity-20" />
              <p>No messages found matching criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((msg) => (
                <div key={msg.id} className="flex flex-col gap-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{msg.userName}</span>
                    <Badge variant={getBadgeVariant(msg.messageType)} className="h-5 px-1.5 text-[10px] capitalize">
                      {msg.messageType}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {msg.createdAt && typeof msg.createdAt === 'string' 
                        ? format(new Date(msg.createdAt), 'p') 
                        : msg.createdAt && (msg.createdAt as any).toDate 
                          ? format((msg.createdAt as any).toDate(), 'p')
                          : ''}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{msg.content}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
