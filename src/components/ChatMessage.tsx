import { generateColorFromName } from '@/lib/username-colors';
import { formatRelativeTime } from '@/lib/format-time';
import { Pin, Trash2, Reply } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
  isAdmin: boolean;
  onPin?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
}

const ChatMessage = ({ 
  message, 
  isAdmin, 
  onPin, 
  onDelete,
  onReply 
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
      <div className="flex justify-center py-2 text-xs text-muted-foreground italic opacity-70">
        {message.content}
      </div>
    );
  }

  return (
    <div className={cn(
      "group flex items-start space-x-3 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors",
      message.isDeleted && "opacity-50"
    )}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={message.userAvatar || undefined} />
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

export default ChatMessage;
