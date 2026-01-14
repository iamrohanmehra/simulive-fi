import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from '@/components/ChatMessage';
import useChat from '@/hooks/useChat';
import PollVoteCard from '@/components/PollVoteCard';
import { useAuth } from '@/contexts/AuthContext';
import type { Poll } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';


interface ChatSidebarProps {
  sessionId: string;
  isAdmin: boolean;
  activePoll: Poll | null;
}

export default function ChatSidebar({ sessionId, isAdmin, activePoll }: ChatSidebarProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage, pinMessage, deleteMessage } = useChat(sessionId);
  const [messageInput, setMessageInput] = useState('');
  const [isAtBottom, setIsAtBottom] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive if user was at bottom
  useEffect(() => {
    if (isAtBottom && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  // Initial scroll to bottom on load
  useEffect(() => {
    if (!loading && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [loading]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    const isBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
    setIsAtBottom(isBottom);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    try {
      await sendMessage(messageInput);
      setMessageInput('');
      setIsAtBottom(true); // Force scroll to bottom on send
    } catch (error) {
      // Error is handled in hook, but we catch here to prevent unhandled promise rejection if passed up
      // Hook already toasts
    }
  };

  return (
    <Card className="flex flex-col h-full w-[350px] border-l rounded-none border-y-0 border-r-0 bg-background">
      <div className="p-3 border-b bg-card/50 backdrop-blur-sm">
        <h3 className="font-semibold text-sm">Live Chat</h3>
      </div>

      <ScrollArea 
        className="flex-1 p-4" 
        onScrollCapture={handleScroll} 
      >
        <div className="space-y-4 pr-4"> 
          {activePoll && user && (
            <PollVoteCard 
              poll={activePoll} 
              userId={user.uid} 
            />
          )}

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <LoadingSpinner size="sm" text="Loading chat..." />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-10 opacity-70">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isAdmin={isAdmin}
                onPin={pinMessage}
                onDelete={deleteMessage}
                // onReply stub for now, or implement if hook has it (hook doesn't have it yet)
                onReply={(id) => {
                  const msg = messages.find(m => m.id === id);
                  if (msg) {
                     setMessageInput(`@${msg.userName} `);
                  }
                }}
              />
            ))
          )}
          <div ref={bottomRef} className="h-px" />
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-card mt-auto">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input 
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" size="icon" disabled={loading || !messageInput.trim()}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </Card>
  );
}
