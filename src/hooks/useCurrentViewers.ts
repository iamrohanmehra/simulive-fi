import { useEffect, useState } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function useCurrentViewers(sessionId: string) {
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    if (!sessionId) return;

    // Query active sessions for this simulive event
    const q = query(
      collection(db, 'viewer_sessions'),
      where('sessionId', '==', sessionId),
      where('leftAt', '==', null)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setViewerCount(snapshot.size);
    }, (error) => {
      console.error('Error fetching viewer count:', error);
    });

    return () => unsubscribe();
  }, [sessionId]);

  return { viewerCount };
}
