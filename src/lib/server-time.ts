import { collection, addDoc, getDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Get the current server time from Firestore
 * 
 * This function replaces Supabase's RPC get_server_time() function.
 * It works by creating a temporary document with serverTimestamp(),
 * reading back the actual timestamp value, and then cleaning up.
 * 
 * @returns Promise<Date> - The server's current timestamp as a Date object
 * @throws Error if unable to get server time
 */
export async function getServerTime(): Promise<Date> {
  try {
    // Create a temporary document with server timestamp
    const serverTimeRef = collection(db, 'server_time');
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

    // Delete the temporary document to clean up
    await deleteDoc(docRef);

    // Convert Firestore Timestamp to JavaScript Date
    return timestamp.toDate();
  } catch (error) {
    console.error('Error getting server time:', error);
    throw new Error(`Failed to get server time: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
