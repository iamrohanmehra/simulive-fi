import React, { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Download, Pin, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import useChat from '@/hooks/useChat';
import ChatMessage from '@/components/ChatMessage';
import ConfirmDialog from '@/components/ConfirmDialog';


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
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isAtBottom && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

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
    if (msg) onReply(msg.userId);
  };

  // Bulk Actions
  const toggleSelection = (messageId: string, selected: boolean) => {
    const newSet = new Set(selectedIds);
    if (selected) newSet.add(messageId);
    else newSet.delete(messageId);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(messages.map(m => m.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = async () => {
    // Execute deletions
    const promises = Array.from(selectedIds).map(id => deleteMessage(id));
    await Promise.all(promises);
    
    toast.success(`Deleted ${selectedIds.size} messages`);
    setSelectedIds(new Set());
    setShowDeleteConfirm(false);
  };

  const handleBulkPin = async () => {
    const promises = Array.from(selectedIds).map(id => pinMessage(id));
    await Promise.all(promises);
    
    toast.success(`Toggled pin for ${selectedIds.size} messages`);
    setSelectedIds(new Set());
  };

  const handleBulkExport = () => {
    const selectedMessages = messages.filter(m => selectedIds.has(m.id));
    const dataStr = JSON.stringify(selectedMessages, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `chat-export-${sessionId}-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${selectedMessages.length} messages`);
    setSelectedIds(new Set());
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-200px)] overflow-hidden border-0 shadow-sm ring-1 ring-border">
      <CardHeader className="border-b bg-muted/30 py-3">
        <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
            Live Chat Feed
            <Badge variant="secondary" className="text-xs font-normal">
                {messages.length} messages
            </Badge>
            </CardTitle>
            
            {messages.length > 0 && (
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={messages.length > 0 && selectedIds.size === messages.length}
                        onCheckedChange={(c) => toggleSelectAll(!!c)}
                        id="select-all"
                    />
                    <label htmlFor="select-all" className="text-xs text-muted-foreground cursor-pointer select-none">
                        Select All
                    </label>
                </div>
            )}
        </div>
        
        {/* Bulk Action Bar - Animated */}
        <div className={cn(
            "grid grid-cols-[1fr_auto] gap-4 items-center overflow-hidden transition-all duration-300 ease-in-out",
            selectedIds.size > 0 ? "h-10 opacity-100 mt-2" : "h-0 opacity-0 mt-0"
        )}>
            <div className="text-xs font-medium text-foreground">
                {selectedIds.size} selected
            </div>
            <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setSelectedIds(new Set())}>
                    Clear
                </Button>
                <Button size="sm" variant="outline" className="h-8 px-2 gap-1 text-xs" onClick={handleBulkExport}>
                    <Download className="h-3 w-3" /> Export
                </Button>
                <Button size="sm" variant="outline" className="h-8 px-2 gap-1 text-xs" onClick={handleBulkPin}>
                    <Pin className="h-3 w-3" /> Pin
                </Button>
                <Button size="sm" variant="destructive" className="h-8 px-2 gap-1 text-xs" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="h-3 w-3" /> Delete
                </Button>
            </div>
        </div>
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
                selectionMode={true}
                isSelected={selectedIds.has(msg.id)}
                onSelect={toggleSelection}
              />
            ))
          )}
          <div ref={bottomRef} className="h-px" />
        </div>
      </ScrollArea>
      
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedIds.size} messages?`}
        description="This will soft-delete the selected messages. They will be hidden from viewers but remain in the database."
        confirmText="Delete Selected"
        cancelText="Cancel"
      />
    </Card>
  );
};

export default AdminChatFeed;
