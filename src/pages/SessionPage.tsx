import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import useSessionState from '@/hooks/useSessionState';
import useViewerTracking from '@/hooks/useViewerTracking';
import useCurrentViewers from '@/hooks/useCurrentViewers';
import CountdownScreen from '@/components/CountdownScreen';
import DualVideoPlayer from '@/components/DualVideoPlayer';
import ChatSidebar from '@/components/ChatSidebar';
import SessionEndedScreen from '@/components/SessionEndedScreen';
import EmailVerificationModal from '@/components/EmailVerificationModal';
import JoinSessionModal from '@/components/JoinSessionModal';

const SessionPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  
  // Local state for modal flow
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [userData, setUserData] = useState<{ name: string; avatar: string } | null>(null);

  // 1. Session State Management
  const { sessionState, session, loading } = useSessionState(sessionId || '');

  // 2. Viewer Tracking - Only track after user has fully joined
  useViewerTracking({ 
    sessionId: (hasJoined && sessionId) ? sessionId : '', 
    userId: user?.uid ?? null 
  });

  // 3. Current Viewer Count
  const { viewerCount } = useCurrentViewers(sessionId || '');

  // Initial verification check
  useEffect(() => {
    const storedData = localStorage.getItem('codekaroUserData');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setUserData(parsed);
        setShowEmailModal(false);
        // Only show join modal if session is loaded and live/ready
        // But for simplicity/requirement flow: verify -> join
        setShowJoinModal(true);
      } catch (e) {
        setShowEmailModal(true);
      }
    } else {
      setShowEmailModal(true);
    }
  }, []);

  const handleVerified = () => {
    // Re-fetch user data from local storage or context if needed, 
    // but for now we trust the modal might have updated it or we check localStorage again
    const storedData = localStorage.getItem('codekaroUserData');
    if (storedData) {
      setUserData(JSON.parse(storedData));
    }
    setShowEmailModal(false);
    setShowJoinModal(true);
  };

  const handleJoin = () => {
    setHasJoined(true);
    setShowJoinModal(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || !sessionId) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Session not found</h1>
          <p className="text-muted-foreground mt-2">The session you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modals are rendered at root level but controlled by state */}
      <EmailVerificationModal 
        isOpen={showEmailModal} 
        onClose={() => {}} // Cannot close manually
        onVerified={handleVerified}
      />
      
      <JoinSessionModal 
        isOpen={showJoinModal} 
        onClose={() => {
          // Optional: handle close if we want to allow backing out?
          // For now, if they close, they basically stay on the page but can't see content?
          // Or we re-open? The requirement says "Simple, single-action modal".
          // If they close, maybe we just don't set hasJoined.
          // But to be safe vs shadcn dialog behavior:
          setShowJoinModal(false); // They can't proceed without clicking Join
        }}
        userName={userData?.name || 'Guest'} 
        sessionTitle={session.title}
        onJoin={handleJoin}
      />

      {/* Main Content Render */}
      {(() => {
        switch (sessionState) {
          case 'scheduled':
            return (
              <CountdownScreen 
                scheduledStart={new Date(session.scheduledStart)}
                sessionTitle={session.title}
                waitingCount={viewerCount}
              />
            );

          case 'live':
            // Only show live content if joined
            if (!hasJoined) {
               // Show a background or loader or just empty while modal is up
               // The modal backdrop covers this usually.
               return (
                 <div className="h-screen w-full bg-black flex items-center justify-center">
                   {/* Background placeholder */}
                 </div>
               );
            }

            return (
              <div className="flex h-screen w-full bg-background overflow-hidden">
                {/* Main Content - Video Player */}
                <div className="flex-1 relative bg-black">
                  <DualVideoPlayer session={session} />
                </div>

                {/* Right Sidebar - Chat */}
                <div className="w-[350px] border-l border-border h-full flex-none">
                  <ChatSidebar 
                    sessionId={sessionId} 
                    isAdmin={false} 
                  />
                </div>
              </div>
            );

          case 'ended':
            return (
              <SessionEndedScreen 
                sessionTitle={session.title}
              />
            );

          default:
            return null;
        }
      })()}
    </>
  );
};

export default SessionPage;
