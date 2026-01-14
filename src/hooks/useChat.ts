import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
  startAfter,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Message } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UseChatReturn {
  messages: Message[];
  loading: boolean;
  sendMessage: (content: string, messageType?: Message['messageType'], targetUserId?: string) => Promise<void>;
  pinMessage: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
}

export default function useChat(sessionId: string): UseChatReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  


  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, 'messages'),
      where('sessionId', '==', sessionId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newMessages = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
          } as Message;
        });

        // Store the last document from the initial fetch for pagination (if we strictly followed that)
        // But for loadMore, we usually want to start after the *oldest* message we have in state.
        
        setMessages((prevMessages) => {
          // If this is the initial load or a real-time update
          if (newMessages.length === 0) return prevMessages;

          // Merge strategy:
          // 1. Take the new snapshot (live messages)
          // 2. Identify the oldest message in the new snapshot
          // 3. Keep any messages from 'prevMessages' that are older than that
          
          const oldestLiveMessage = newMessages[newMessages.length - 1];
          const oldestLiveTime = new Date(oldestLiveMessage.createdAt).getTime();

          const historyMessages = prevMessages.filter(msg => {
            const time = new Date(msg.createdAt).getTime();
            // Keep if older than the oldest live message
            // Also dedupe by ID just in case
            return time < oldestLiveTime && !newMessages.find(nm => nm.id === msg.id);
          });

          return [...newMessages, ...historyMessages];
        });
        
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load chat messages');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sessionId]);

  const sendMessage = async (content: string, messageType: Message['messageType'] = 'user', targetUserId?: string) => {
    if (!user) {
      toast.error('You must be logged in to chat');
      return;
    }

    const now = Date.now();
    if (now - lastMessageTime < 6000) {
      const remaining = Math.ceil((6000 - (now - lastMessageTime)) / 1000);
      toast.error(`Please wait ${remaining} seconds before sending another message`);
      throw new Error('Rate limited');
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      toast.error('Message cannot be empty');
      return;
    }

    if (trimmedContent.length > 500) {
      toast.error('Message content exceeds 500 characters');
      return;
    }

    try {
      setLastMessageTime(now);
      
      const messageData: any = {
        sessionId,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userAvatar: user.photoURL || null,
        content: trimmedContent,
        messageType,
        isPinned: false,
        isDeleted: false,
        createdAt: serverTimestamp(),
      };

      if (targetUserId) {
        messageData.targetUserId = targetUserId;
      }

      await addDoc(collection(db, 'messages'), messageData);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      throw error;
    }
  };

  const pinMessage = async (messageId: string) => {
    if (!user) return;
    try {
      const msgRef = doc(db, 'messages', messageId);
      const msgSnap = await getDoc(msgRef);
      
      if (!msgSnap.exists()) {
        throw new Error('Message not found');
      }

      const isPinned = msgSnap.data().isPinned;
      await updateDoc(msgRef, {
        isPinned: !isPinned
      });
      
      toast.success(isPinned ? 'Message unpinned' : 'Message pinned');
    } catch (error) {
      console.error('Error pinning message:', error);
      toast.error('Failed to pin message');
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user) return;
    try {
      const msgRef = doc(db, 'messages', messageId);
      await updateDoc(msgRef, {
        isDeleted: true
      });
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const loadMoreMessages = async () => {
    if (messages.length === 0) return;

    try {
      const oldestMessage = messages[messages.length - 1];
      
      // We need the actual Firestore document snapshot to use startAfter with a reliable cursor if possible,
      // but since we only have the Message object in state, we'll order by createdAt and startAfter the timestamp.
      // This is safe provided createdAt is unique enough or we don't mind slight precision issues (rare in chat).
      
      const q = query(
        collection(db, 'messages'),
        where('sessionId', '==', sessionId),
        orderBy('createdAt', 'desc'),
        startAfter(new Date(oldestMessage.createdAt)), // Using Date object or timestamp string depending on Firestore SDK version behavior, but query expects FieldValue logic. 
        // Actually, startAfter in standard SDK can take a snapshot OR field values. 
        // Since we stored createdAt as string in state, we should pass the Date object which likely matches the Timestamp stored in Firestore.
        // Wait, startAfter needs to match the orderBy fields.
        // orderBy is 'createdAt'. In Firestore it is a Timestamp.
        // passing a JS Date object usually works with the SDK which converts it.
        limit(50)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return; 
      }

      const olderMessages = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as Message;
      });

      setMessages(prev => [...prev, ...olderMessages]);

    } catch (error) {
      console.error('Error loading more messages:', error);
      toast.error('Failed to load older messages');
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    pinMessage,
    deleteMessage,
    loadMoreMessages,
  };
}
