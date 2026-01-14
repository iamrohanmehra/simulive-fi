import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Play, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateDoc } from 'firebase/firestore';
import ConfirmDialog from '@/components/ConfirmDialog';

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import useSessionState from '@/hooks/useSessionState';
import useCurrentViewers from '@/hooks/useCurrentViewers';
import useChat from '@/hooks/useChat';
import BroadcastMessage from '@/components/BroadcastMessage';
import DirectReplyPanel from '@/components/DirectReplyPanel';
import AdminChatFeed from '@/components/AdminChatFeed';
import PollCreator from '@/components/PollCreator';
import ActivePollsPanel from '@/components/ActivePollsPanel';
import { sessionDoc } from '@/lib/firestore-collections';
import computeSessionAnalytics from '@/lib/compute-analytics';
import LoadingSpinner from '@/components/LoadingSpinner';

const LiveAdminPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { sessionState, session, loading: sessionLoading } = useSessionState(sessionId || '');
  const { viewerCount } = useCurrentViewers(sessionId || '');
  
  // Chat hooks
  const { messages } = useChat(sessionId || '');

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false);

  const handleReplyUser = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleEndSessionClick = () => {
    setShowEndSessionDialog(true);
  };

  const handleEndSessionConfirm = async () => {
    if (!sessionId) return;
    try {
      toast.info('Ending session...');
      
      // 1. Mark session as ended
      await updateDoc(sessionDoc(sessionId), { isLive: false });
      
      // 2. Compute analytics
      toast.info('Computing analytics...');
      await computeSessionAnalytics(sessionId);
      
      toast.success('Session ended and analytics computed!');
      navigate(`/analytics/${sessionId}`);
    } catch (error) {
      console.error('Failed to end session:', error);
      toast.error('Failed to end session properly');
    }
  };

  if (sessionLoading) {
    return <LoadingSpinner size="lg" text="Loading session..." className="min-h-screen" />;
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

          <div className="flex justify-end">
             <Button variant="destructive" size="lg" className="w-full" onClick={handleEndSessionClick}>End Session</Button>
          </div>
        </div>

        {/* Right Column: Chat Feed */}
        <AdminChatFeed 
          sessionId={sessionId || ''} 
          onReply={handleReplyUser}
        />
      </div>

      <ConfirmDialog
        isOpen={showEndSessionDialog}
        onClose={() => setShowEndSessionDialog(false)}
        onConfirm={handleEndSessionConfirm}
        title="End Session?"
        description="Are you sure you want to end this session? This action cannot be undone and will stop the stream for all viewers."
        confirmText="End Session"
        cancelText="Cancel"
      />
    </div>
  );
};

export default LiveAdminPage;
