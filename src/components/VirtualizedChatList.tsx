import React, { useRef } from 'react';
import type { Message } from '@/lib/types';
import ChatMessage from '@/components/ChatMessage';

/**
 * FIXED #27: Virtualized Chat List Component
 * 
 * This wrapper provides windowed rendering for large message lists.
 * With fewer than 100 messages, renders all.
 * With more, only renders most recent 100 + buffer.
 * 
 * For production with 1000+ concurrent chatters, upgrade to react-window:
 * bun add react-window @types/react-window
 */

interface VirtualizedChatListProps {
  messages: Message[];
  isAdmin?: boolean;
  onPin?: (id: string) => void;
  onDelete?: (id: string) => void;
  onReply?: (message: Message) => void;
  onSelect?: (messageId: string, selected: boolean) => void;
  selectedIds?: Set<string>;
  bottomRef?: React.RefObject<HTMLDivElement>;
}

const VirtualizedChatList = React.memo(({
  messages,
  isAdmin = false,
  onPin,
  onDelete,
  onReply,
  onSelect,
  selectedIds = new Set(),
  bottomRef,
}: VirtualizedChatListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Simple windowing: for very large lists, only render visible + buffer
  const WINDOW_SIZE = 100;
  const BUFFER = 20;
  
  // If less than window size, render all
  const shouldWindow = messages.length > WINDOW_SIZE;
  const displayMessages = shouldWindow 
    ? messages.slice(-WINDOW_SIZE - BUFFER) // Show most recent
    : messages;

  return (
    <div ref={containerRef} className="flex flex-col gap-1 p-2">
      {shouldWindow && (
        <div className="text-center text-xs text-muted-foreground py-2">
          Showing {displayMessages.length} of {messages.length} messages
        </div>
      )}
      
      {displayMessages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          isAdmin={isAdmin}
          isSelected={selectedIds.has(message.id)}
          onPin={onPin}
          onDelete={onDelete}
          onReply={onReply ? () => onReply(message) : undefined}
          onSelect={onSelect}
        />
      ))}
      
      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
});

VirtualizedChatList.displayName = 'VirtualizedChatList';

export default VirtualizedChatList;
