import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import useSessionState from '@/hooks/useSessionState';
import useViewerTracking from '@/hooks/useViewerTracking';
import useCurrentViewers from '@/hooks/useCurrentViewers';
import CountdownScreen from '@/components/CountdownScreen';
import { Suspense, lazy } from 'react';
import ChatSidebar, { type ChatSidebarRef } from '@/components/ChatSidebar';
import SessionEndedScreen from '@/components/SessionEndedScreen';
import EmailVerificationModal from '@/components/EmailVerificationModal';
import JoinSessionModal from '@/components/JoinSessionModal';
import HelpModal from '@/components/HelpModal';
import { pollsCollection } from '@/lib/firestore-collections';
import { query, where, onSnapshot } from 'firebase/firestore';
import type { Poll } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts';
import ConnectionStatus from '@/components/ConnectionStatus';
import { logEvent } from '@/lib/analytics';

// Lazy load heavy Video Player
import { startTrace, endTrace } from '@/lib/performance';
import { logError } from '@/lib/error-logger';

// Lazy load heavy Video Player
const DualVideoPlayer = lazy(() => import('@/components/DualVideoPlayer'));

const SessionPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  
  // Performance Tracing
  useEffect(() => {
    const t = startTrace('session_page_load');
    return () => endTrace(t);
  }, []);
  
  // Local state for modal flow
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [userData, setUserData] = useState<{ name: string; avatar: string } | null>(null);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [displayedPoll, setDisplayedPoll] = useState<Poll | null>(null);

  const chatSidebarRef = useRef<ChatSidebarRef>(null);

  // Keyboard Shortcuts
  useKeyboardShortcuts([
    {
      key: 'm',
      ctrl: true,
      handler: () => {
        chatSidebarRef.current?.focusInput();
      }
    },
    {
      key: 'h',
      ctrl: true,
      handler: () => {
        setShowHelpModal(prev => !prev);
      }
    },
    {
      key: 'Escape',
      handler: () => {
        // If help modal is open, close it
        if (showHelpModal) {
          setShowHelpModal(false);
          return;
        }
        // Otherwise clear chat input
        chatSidebarRef.current?.clearInput();
      }
    }
  ]);

  // 1. Session State Management
  const { sessionState, session, loading } = useSessionState(sessionId || '');

  // 2. Viewer Tracking - Only track after user has fully joined
  useViewerTracking({ 
    sessionId: (hasJoined && sessionId) ? sessionId : '', 
    userId: user?.uid ?? null 
  });

  // 3. Current Viewer Count
  const { viewerCount } = useCurrentViewers(sessionId || '');

  // Initial verification check and sync with Firebase Auth
  useEffect(() => {
    // If we have a firebase user, we are "verified" in terms of access
    if (user) {
        setShowEmailModal(false);
        // set hasJoined to true? No, let them click Join.
        if (!hasJoined) setShowJoinModal(true);
        
        // Load user data from profile
        setUserData({
            name: user.displayName || 'Guest',
            avatar: user.photoURL || ''
        });
    } else {
        // Not logged in to Firebase.
        // Check if we have legacy local storage data to "auto-login"?
        // For security/cleanliness, better to force re-verification if session expired?
        // But user experience says: if I refreshed, stay logged in.
        // Codekaro flow: LocalStorage might be used, but Firebase Auth persistence is better.
        // If Firebase is loading, we wait.
        // If Firebase is not loading and no user -> Show Email Modal.
        if (!loading) {
            setShowEmailModal(true);
        }
    }
  }, [user, loading, hasJoined]);

  const handleVerified = useCallback(() => {
    // This is called when EmailVerificationModal succeeds.
    // The modal itself calls loginWithCodekaro, which sets the user.
    // So the effect above [user] will trigger and close the modal.
    // We just ensure state is clean here.
    setShowEmailModal(false);
  }, []);

  const handleJoin = useCallback(() => {
    setHasJoined(true);
    setShowJoinModal(false);
    
    if (sessionId) {
      logEvent({
        name: 'session_joined',
        params: {
          session_id: sessionId,
          user_id: user?.uid ?? null
        }
      });
    }
  }, [sessionId, user]);

  // Poll sync logic
  useEffect(() => {
    if (!sessionId) return;

    const q = query(
      pollsCollection, 
      where('sessionId', '==', sessionId), 
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // Active poll exists
        const data = snapshot.docs[0].data();
        const poll = { ...data, id: snapshot.docs[0].id } as Poll;
        setActivePoll(poll);
        setDisplayedPoll(poll);
      } else {
        // No active poll
        setActivePoll(null);
        // If we had a displayed poll, keep it for 10s then clear
        // We only start timer if we have a displayed poll and just lost active poll
        // But here we just set activePoll to null. 
        // We need a derived effect or just logic here.
        // If we currently have a displayed poll, start a timeout to clear it.
        // BUT, we need to distinguish between "just loaded empty" and "was active, now empty".
        // State updates are async, so let's rely on an effect that watches activePoll.
      }
    }, (error) => {
        logError(error, { action: 'poll_sync', sessionId });
    });

    return () => unsubscribe();
  }, [sessionId]);

  // Handle poll grace period
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (activePoll) {
      setDisplayedPoll(activePoll);
    } else {
      // Poll inactive. If we have a displayed poll, wait 10s to clear it
      if (displayedPoll) {
        timeout = setTimeout(() => {
          setDisplayedPoll(null);
        }, 10000);
      }
    }

    return () => clearTimeout(timeout);
  }, [activePoll]);


  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <LoadingSpinner size="lg" text="Loading session..." />
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
      <ConnectionStatus />
      
      <HelpModal 
        isOpen={showHelpModal} 
        onClose={() => setShowHelpModal(false)} 
        shortcuts={[
          { label: 'Focus Chat', combination: 'Ctrl + M' },
          { label: 'Toggle Help', combination: 'Ctrl + H' },
          { label: 'Clear Chat / Close', combination: 'Esc' },
        ]}
      />

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
      <main id="main-content" className="w-full h-full">
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
                    <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><LoadingSpinner text="Loading player..." /></div>}>
                      <DualVideoPlayer session={session} />
                    </Suspense>
                  </div>

                  {/* Right Sidebar - Chat */}
                  <div className="w-[350px] border-l border-border h-full flex-none">
                    <ChatSidebar 
                      ref={chatSidebarRef}
                      sessionId={sessionId} 
                      isAdmin={false} 
                      activePoll={displayedPoll}
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
      </main>
    </>
  );
};

export default SessionPage;
