import React from 'react';
import { generateColorFromName } from '@/lib/username-colors';
import { formatRelativeTime } from '@/lib/format-time';
import { Pin, Trash2, Reply } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';

import { Checkbox } from '@/components/ui/checkbox';

interface ChatMessageProps {
  message: Message;
  isAdmin?: boolean;
  onPin?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (userId: string) => void;
  onSelect?: (messageId: string, selected: boolean) => void;
  isSelected?: boolean;
  selectionMode?: boolean;
}

const ChatMessage = ({ 
  message, 
  isAdmin = false, 
  onPin, 
  onDelete, 
  onReply,
  onSelect,
  isSelected = false,
  selectionMode = false
}: ChatMessageProps) => {
  const colorClass = generateColorFromName(message.userName || 'Anonymous');
  // Derive background color from text color class (e.g., text-blue-400 -> bg-blue-400/20)
  const bgClass = colorClass.replace('text-', 'bg-') + '/20';
  
  const initials = message.userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isSystem = message.messageType === 'system';
  
  if (isSystem) {
    return (
      // Updated system message div
      <div className={cn("flex items-center gap-2 py-1 justify-center text-xs text-muted-foreground/70", selectionMode && "pl-8")}>
        <span>{message.content}</span>
      </div>
    );
  }

  return (
    <div className={cn(
      // Updated main message div classes
      "group relative flex items-start gap-2 py-1 px-2 rounded-md hover:bg-muted/50 transition-colors",
      message.isPinned && "bg-indigo-50/50 dark:bg-indigo-950/20 border-l-2 border-indigo-500 pl-2",
      isSelected && "bg-muted"
    )}>
      {selectionMode && onSelect && ( // Conditional Checkbox rendering
        <div className="flex h-full items-center mr-1">
           <Checkbox 
             checked={isSelected}
             onCheckedChange={(checked) => onSelect(message.id, !!checked)}
           />
        </div>
      )}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={message.userAvatar || undefined} loading="lazy" />
        <AvatarFallback className={cn("text-xs font-semibold", colorClass, bgClass)}>
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn("text-sm font-semibold truncate", colorClass)}>
            {message.userName}
          </span>
          
          {message.messageType === 'admin' && (
            <Badge variant="destructive" className="h-4 px-1 text-[10px] uppercase">
              Admin
            </Badge>
          )}
          
          {message.isPinned && (
            <Badge variant="outline" className="h-4 px-1 text-[10px] border-primary text-primary">
              Pinned
            </Badge>
          )}

          <span className="text-[10px] text-muted-foreground ml-auto whitespace-nowrap">
            {formatRelativeTime(new Date(message.createdAt))}
          </span>
        </div>

        <p className={cn(
          "text-sm text-foreground wrap-break-word leading-relaxed",
          message.isDeleted && "line-through text-muted-foreground italic"
        )}>
          {message.isDeleted ? "Message deleted" : message.content}
        </p>
      </div>

      {isAdmin && !message.isDeleted && (
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 bg-background/80 rounded-md shadow-sm border">
          {onPin && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={() => onPin(message.id)}
              title={message.isPinned ? "Unpin" : "Pin"}
            >
              <Pin className={cn("h-3.5 w-3.5", message.isPinned && "fill-current")} />
            </Button>
          )}
          
          {onDelete && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-destructive hover:text-destructive" 
              onClick={() => onDelete(message.id)}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
           {onReply && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={() => onReply(message.id)}
              title="Reply"
            >
              <Reply className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(ChatMessage, (prevProps, nextProps) => {
  // Only re-render if:
  // 1. Message ID changes (unlikely for same component instance but possible)
  // 2. Message content/pin/delete status changes
  // 3. Selection state changes
  // 4. Admin mode changes
  
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.isPinned === nextProps.message.isPinned &&
    prevProps.message.isDeleted === nextProps.message.isDeleted &&
    prevProps.message.userAvatar === nextProps.message.userAvatar &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.selectionMode === nextProps.selectionMode &&
    prevProps.isAdmin === nextProps.isAdmin
  );
});
