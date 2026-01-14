import React, { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import useChat from '@/hooks/useChat';
import ChatMessage from '@/components/ChatMessage';

interface AdminChatFeedProps {
  sessionId: string;
  onReply: (userId: string) => void;
}

const AdminChatFeed = ({ sessionId, onReply }: AdminChatFeedProps) => {
  const { 
    messages, 
    loading: chatLoading, 
    pinMessage, 
    deleteMessage 
  } = useChat(sessionId);

  const bottomRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Auto-scroll to bottom when new messages arrive if user was at bottom
  useEffect(() => {
    if (isAtBottom && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  // Initial scroll to bottom on load
  useEffect(() => {
    if (!chatLoading && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [chatLoading]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    const isBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
    setIsAtBottom(isBottom);
  };

  const handleReply = (messageId: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (msg) {
      onReply(msg.userId);
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-200px)] overflow-hidden border-0 shadow-sm ring-1 ring-border">
      <CardHeader className="border-b bg-muted/30 py-3">
        <CardTitle className="text-base flex items-center gap-2">
          Live Chat Feed
          <Badge variant="secondary" className="text-xs font-normal">
            {messages.length} messages
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <ScrollArea 
        className="flex-1 p-4 bg-background/50"
        onScrollCapture={handleScroll}
      >
        <div className="space-y-4 pr-2">
          {chatLoading ? (
            <div className="space-y-4 p-4 animate-pulse">
              <div className="h-10 w-3/4 bg-muted rounded" />
              <div className="h-10 w-1/2 bg-muted rounded" />
              <div className="h-10 w-full bg-muted rounded" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground opacity-50">
              <p>No messages yet</p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isAdmin={true}
                onPin={pinMessage}
                onDelete={deleteMessage}
                onReply={() => handleReply(msg.id)}
              />
            ))
          )}
          <div ref={bottomRef} className="h-px" />
        </div>
      </ScrollArea>
    </Card>
  );
};

export default AdminChatFeed;
