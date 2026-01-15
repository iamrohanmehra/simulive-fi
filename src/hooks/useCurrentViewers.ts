import { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function useCurrentViewers(sessionId: string) {
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    if (!sessionId) return;

    let mounted = true;

    const fetchCount = async () => {
      try {
        const q = query(
          collection(db, 'viewer_sessions'),
          where('sessionId', '==', sessionId),
          where('leftAt', '==', null)
        );
        const snapshot = await getCountFromServer(q);
        if (mounted) {
           setViewerCount(snapshot.data().count);
        }
      } catch (error) {
        console.error('Error fetching viewer count:', error);
      }
    };

    fetchCount(); // Initial fetch
    const interval = setInterval(fetchCount, 5000); // Poll every 5s

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [sessionId]);

  return { viewerCount };
}
