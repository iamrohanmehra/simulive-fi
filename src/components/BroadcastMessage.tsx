import { useState } from 'react';
import { Megaphone, Send } from 'lucide-react';
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
import useChat from '@/hooks/useChat';

interface BroadcastMessageProps {
  sessionId: string;
  onSent?: () => void;
}

const BroadcastMessage = ({ sessionId, onSent }: BroadcastMessageProps) => {
  const [broadcastText, setBroadcastText] = useState('');
  const [sending, setSending] = useState(false);
  const { sendMessage } = useChat(sessionId);

  const handleSendBroadcast = async () => {
    if (!broadcastText.trim()) {
      toast.error('Please enter a message correctly');
      return;
    }

    if (broadcastText.length > 500) {
      toast.error('Message too long (max 500 characters)');
      return;
    }

    setSending(true);
    try {
      await sendMessage(broadcastText.trim(), 'admin');
      
      toast.success('Broadcast sent successfully');
      setBroadcastText('');
      if (onSent) {
        onSent();
      }
    } catch (error) {
      console.error('Failed to send broadcast:', error);
      toast.error('Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Megaphone className="h-5 w-5" />
          Broadcast Announcement
        </CardTitle>
        <CardDescription>
          Send a highlighted message to all viewers in the chat.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <Textarea
          placeholder="Type your announcement here..."
          className="resize-none min-h-[100px]"
          value={broadcastText}
          onChange={(e) => setBroadcastText(e.target.value)}
          maxLength={500}
          disabled={sending}
        />
        <div className="text-xs text-muted-foreground text-right mt-1">
          {broadcastText.length}/500
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="destructive" 
          className="w-full" 
          onClick={handleSendBroadcast}
          disabled={!broadcastText.trim() || sending}
        >
          {sending ? (
            'Sending...'
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Broadcast Now
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BroadcastMessage;
