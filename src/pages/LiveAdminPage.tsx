import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Loader2, Play, BarChart2 } from 'lucide-react';

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import useSessionState from '@/hooks/useSessionState';
import useCurrentViewers from '@/hooks/useCurrentViewers';
import useChat from '@/hooks/useChat';
import BroadcastMessage from '@/components/BroadcastMessage';
import DirectReplyPanel from '@/components/DirectReplyPanel';
import AdminChatFeed from '@/components/AdminChatFeed';
import PollCreator from '@/components/PollCreator';
import ActivePollsPanel from '@/components/ActivePollsPanel';

const LiveAdminPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { sessionState, session, loading: sessionLoading } = useSessionState(sessionId || '');
  const { viewerCount } = useCurrentViewers(sessionId || '');
  
  // Chat hooks
  // Chat hooks only needed for DirectReplyPanel now, AdminChatFeed deals with its own
  const { messages } = useChat(sessionId || '');

  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const handleReplyUser = (userId: string) => {
    setSelectedUserId(userId);
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sessionId || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Session not found</h1>
        <p className="text-muted-foreground">The requested session could not be found.</p>
      </div>
    );
  }

  if (sessionState !== 'live') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4 text-center">
        <div className="bg-muted p-6 rounded-full">
           {sessionState === 'scheduled' ? <Play className="h-10 w-10 text-muted-foreground" /> : <BarChart2 className="h-10 w-10 text-muted-foreground" />}
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Session is {sessionState}</h1>
          <p className="text-muted-foreground max-w-md">
            The Live Control Panel is only available when the session is effectively live.
            Current status: <Badge variant="outline" className="ml-1 capitalize">{sessionState}</Badge>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8 space-y-6">
      <header className="flex items-center justify-between pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Control Panel</h1>
          <p className="text-muted-foreground mt-1 text-lg">{session.title}</p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
        {/* Left Column: Controls & Stats */}
        <div className="space-y-6">
          <Card className="border-l-4 border-l-indigo-500 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Live Viewers
              </CardTitle>
              <Users className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div key={viewerCount} className="text-4xl font-bold text-indigo-600 animate-[pulse_1s_ease-in-out_1]">
                {viewerCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently watching the stream
              </p>
            </CardContent>
          </Card>

          <ActivePollsPanel sessionId={sessionId || ''} />
          <PollCreator sessionId={sessionId || ''} />

          <BroadcastMessage sessionId={sessionId || ''} />
          <DirectReplyPanel 
            sessionId={sessionId || ''} 
            messages={messages} 
            selectedUserId={selectedUserId}
            onUserSelect={setSelectedUserId}
          />
        </div>

        {/* Right Column: Chat Feed */}
        <AdminChatFeed 
          sessionId={sessionId || ''} 
          onReply={handleReplyUser}
        />
      </div>
    </div>
  );
};

export default LiveAdminPage;
