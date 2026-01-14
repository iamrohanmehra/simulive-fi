import { useEffect, useRef } from 'react';
import { 
  addDoc, 
  collection, 
  doc, 
  serverTimestamp, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UseViewerTrackingProps {
  sessionId: string;
  userId?: string | null;
}

export default function useViewerTracking({ sessionId, userId }: UseViewerTrackingProps) {
  const viewerSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    // 1. Create viewer session on mount
    const createSession = async () => {
      try {
        const viewerRef = await addDoc(collection(db, 'viewer_sessions'), {
          sessionId,
          userId: userId ?? null,
          email: localStorage.getItem('userEmail') || null, // Fallback to localStorage for now
          joinedAt: serverTimestamp(),
          leftAt: null,
        });
        viewerSessionIdRef.current = viewerRef.id;
      } catch (error) {
        console.error('Failed to create viewer session:', error);
      }
    };

    createSession();

    // 2. Handle cleanup on unmount
    return () => {
      if (viewerSessionIdRef.current) {
        const viewerRef = doc(db, 'viewer_sessions', viewerSessionIdRef.current);
        updateDoc(viewerRef, {
          leftAt: serverTimestamp(),
        }).catch((err) => console.error('Failed to update leftAt:', err));
      }
    };
  }, [sessionId, userId]);

  // 3. Handle browser close/reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (viewerSessionIdRef.current) {
        // Note: keeping this simple as sendBeacon/firestore sync is tricky in unload
        // Ideally we rely on presence system or beacon, but for now we try standard update
        // Firestore offline persistence might help queue this
        const viewerRef = doc(db, 'viewer_sessions', viewerSessionIdRef.current);
        updateDoc(viewerRef, {
           leftAt: serverTimestamp() 
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return { viewerSessionId: viewerSessionIdRef.current };
}
