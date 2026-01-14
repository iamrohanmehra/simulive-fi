import { useParams } from 'react-router-dom';
import useSessionState from '@/hooks/useSessionState';
import CountdownScreen from '@/components/CountdownScreen';
import DualVideoPlayer from '@/components/DualVideoPlayer';
import SessionEndedScreen from '@/components/SessionEndedScreen';


const SessionPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { sessionState, session, loading } = useSessionState(sessionId || '');
  
  // We can track viewer count here or mock it for now.
  // For the countdown, we'll use a placeholder or 0 if not available yet.
  const waitingCount = 0; 

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black text-white">
        <div className="animate-pulse">Loading session...</div>
      </div>
    );
  }

  if (!session || !sessionId) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black text-white">
        Session not found
      </div>
    );
  }

  // Pre-calculate live offset to check drift/status if needed, 
  // currently used inside DualVideoPlayer but helpful if we moved logic up.
  // const { liveOffset } = useServerTimeSync(sessionId, session.scheduledStart);

  switch (sessionState) {
    case 'scheduled':
      return (
        <CountdownScreen 
          scheduledStart={new Date(session.scheduledStart)}
          sessionTitle={session.title}
          waitingCount={waitingCount}
        />
      );
      
    case 'live':
      return (
        <div className="w-screen h-screen bg-black overflow-hidden flex flex-col">
           {/* Header or other UI elements could go here */}
           <div className="flex-1 relative">
             <DualVideoPlayer session={session} />
           </div>
           {/* Chat placeholder or sidebar could go here */}
        </div>
      );
      
    case 'ended':
      return (
        <SessionEndedScreen 
          sessionTitle={session.title}
          // Analytics would be passed here if fetched
        />
      );
      
    default:
      return null;
  }
};

export default SessionPage;
