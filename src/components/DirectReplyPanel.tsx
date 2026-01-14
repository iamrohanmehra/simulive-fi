import { useState, useMemo } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import useChat from '@/hooks/useChat';
import type { Message } from '@/lib/types';

interface DirectReplyPanelProps {
  sessionId: string;
  messages: Message[];
  selectedUserId?: string;
  onUserSelect?: (userId: string) => void;
}

const DirectReplyPanel = ({ 
  sessionId, 
  messages, 
  selectedUserId: propSelectedUserId,
  onUserSelect 
}: DirectReplyPanelProps) => {
  const [internalSelectedUserId, setInternalSelectedUserId] = useState<string>('');
  
  // Use prop if available, otherwise internal state
  const selectedUserId = propSelectedUserId !== undefined ? propSelectedUserId : internalSelectedUserId;
  
  const handleUserSelect = (val: string) => {
    if (onUserSelect) {
      onUserSelect(val);
    } else {
      setInternalSelectedUserId(val);
    }
  };


  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const { sendMessage } = useChat(sessionId);

  // Extract unique users from messages
  const uniqueUsers = useMemo(() => {
    const usersMap = new Map<string, { id: string; name: string }>();
    
    messages.forEach((msg) => {
      // Filter out admin messages if we want to reply to students only
      // Also filter out system messages
      if (msg.messageType === 'user' && !usersMap.has(msg.userId)) {
        usersMap.set(msg.userId, {
          id: msg.userId,
          name: msg.userName,
        });
      }
    });

    return Array.from(usersMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }, [messages]);

  const handleSendReply = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user to reply to');
      return;
    }

    if (!replyText.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSending(true);
    try {
      const targetUser = uniqueUsers.find(u => u.id === selectedUserId);
      const targetName = targetUser ? targetUser.name : 'User';

      await sendMessage(replyText.trim(), 'private', selectedUserId);
      
      toast.success(`Sent private message to ${targetName}`);
      setReplyText('');
    } catch (_error) {
      // Hook handles toast error
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500 shadow-sm mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-600">
          <MessageSquare className="h-5 w-5" />
          Direct Message
        </CardTitle>
        <CardDescription>
          Send a private message to a specific student.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pb-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Select Student</label>
          <Select 
            value={selectedUserId} 
            onValueChange={handleUserSelect}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a student..." />
            </SelectTrigger>
            <SelectContent>
              {uniqueUsers.length === 0 ? (
                <SelectItem value="no-users" disabled>No active students found</SelectItem>
              ) : (
                uniqueUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Message</label>
          <Textarea
            placeholder="Type your private message..."
            className="resize-none min-h-[80px]"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            disabled={sending}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
          onClick={handleSendReply}
          disabled={!selectedUserId || !replyText.trim() || sending}
        >
          {sending ? (
            'Sending...'
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Private Message
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DirectReplyPanel;
