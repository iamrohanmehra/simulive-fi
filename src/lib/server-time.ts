import { collection, addDoc, getDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

// FIXED #7 & #25: Cache server time offset to reduce Firestore operations
// Instead of 3 ops per sync (create, read, delete), we now sync once and reuse the offset
let serverTimeOffset: number | null = null;
const OFFSET_CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache validity
let lastSyncTime: number = 0;

/**
 * Get the current server time from Firestore
 * 
 * OPTIMIZED: Uses cached offset to reduce Firestore operations from 3 per call
 * to 3 per cache period (5 minutes). Reduces costs by ~99% for active sessions.
 * 
 * @returns Promise<Date> - The server's current timestamp as a Date object
 * @throws Error if unable to get server time
 */
export async function getServerTime(): Promise<Date> {
  const now = Date.now();
  
  // Return cached time if still valid
  if (serverTimeOffset !== null && (now - lastSyncTime) < OFFSET_CACHE_DURATION_MS) {
    return new Date(now + serverTimeOffset);
  }

  try {
    // Create a temporary document with server timestamp
    const serverTimeRef = collection(db, '_time_sync');
    const startTime = Date.now();
    
    const docRef = await addDoc(serverTimeRef, {
      timestamp: serverTimestamp(),
    });

    // Read back the document to get the actual timestamp value
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Failed to read server time document');
    }

    const data = docSnap.data();
    const timestamp = data.timestamp as Timestamp;
    const serverTime = timestamp.toMillis();
    
    // Account for network latency (rough approximation)
    const endTime = Date.now();
    const latency = (endTime - startTime) / 2;
    
    // Calculate and cache the offset
    serverTimeOffset = serverTime - (startTime + latency);
    lastSyncTime = endTime;

    // Delete the temporary document to clean up (best effort, don't block)
    deleteDoc(docRef).catch(() => {
      // Ignore cleanup errors - the rules allow deletion
    });

    // Convert Firestore Timestamp to JavaScript Date
    return timestamp.toDate();
  } catch (error) {
    // If we have a cached offset, use it as fallback
    if (serverTimeOffset !== null) {
      console.warn('Using cached server time offset due to error:', error);
      return new Date(Date.now() + serverTimeOffset);
    }
    
    console.error('Error getting server time:', error);
    throw new Error(`Failed to get server time: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Force refresh the server time offset cache
 * Useful when detecting significant drift
 */
export function invalidateServerTimeCache(): void {
  serverTimeOffset = null;
  lastSyncTime = 0;
}

