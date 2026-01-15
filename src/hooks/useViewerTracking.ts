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

// FIXED #18: Safe localStorage access for private browsing
function safeGetLocalStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
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
          email: safeGetLocalStorageItem('userEmail') || null,
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

  // FIXED #9: Handle browser close/reload with sendBeacon for reliability
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (viewerSessionIdRef.current) {
        // Use sendBeacon for more reliable delivery during page unload
        // Falls back to standard Firestore update if beacon fails
        const beaconUrl = `/api/leave-session`;
        const data = JSON.stringify({
          viewerSessionId: viewerSessionIdRef.current,
          leftAt: Date.now()
        });
        
        // Try sendBeacon first (more reliable for unload)
        const beaconSent = navigator.sendBeacon?.(beaconUrl, data);
        
        if (!beaconSent) {
          // Fallback: try standard update (may or may not complete)
          const viewerRef = doc(db, 'viewer_sessions', viewerSessionIdRef.current);
          updateDoc(viewerRef, {
            leftAt: serverTimestamp() 
          }).catch(() => {
            // Expected to fail sometimes during unload
          });
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return { viewerSessionId: viewerSessionIdRef.current };
}

