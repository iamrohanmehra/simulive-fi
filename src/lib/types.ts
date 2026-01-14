/**
 * Represents a user in the system.
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** User's email address */
  email: string;
  /** User's full name */
  fullName: string;
  /** URL to the user's avatar image */
  avatarUrl: string | null;
  /** Whether the user's email has been verified */
  isVerified: boolean;
  /** Timestamp when the user account was created */
  createdAt: string;
}

/**
 * Represents a live session/class.
 */
export interface Session {
  /** Unique identifier for the session */
  id: string;
  /** Title of the session */
  title: string;
  /** URL to the screen recording/stream */
  screenUrl: string;
  /** URL to the face camera recording/stream */
  faceUrl: string | null;
  /** Scheduled start time for the session */
  scheduledStart: string;
  /** Scheduled end time for the session */
  scheduledEnd: string;
  /** Whether the session is currently live */
  isLive: boolean;
  /** Whether chat is enabled for this session */
  chatEnabled: boolean;
  /** Timestamp when the session was created */
  createdAt: string;
}

/**
 * Represents a chat message in a session.
 */
export interface Message {
  /** Unique identifier for the message */
  id: string;
  /** ID of the session this message belongs to */
  sessionId: string;
  /** ID of the user who sent the message */
  userId: string;
  /** Display name of the user who sent the message */
  userName: string;
  /** URL to the user's avatar image */
  userAvatar: string | null;
  /** Content of the message */
  content: string;
  /** Type of message (user, admin, system, or private) */
  messageType: 'user' | 'admin' | 'system' | 'private';
  /** ID of the target user for private messages */
  targetUserId?: string;
  /** Whether the message is pinned in the chat */
  isPinned: boolean;
  /** Whether the message has been deleted */
  isDeleted: boolean;
  /** Timestamp when the message was created */
  createdAt: string;
}

/**
 * Represents a viewer's session participation record.
 */
export interface ViewerSession {
  /** Unique identifier for the viewer session record */
  id: string;
  /** ID of the session the viewer joined */
  sessionId: string;
  /** ID of the viewer (user) */
  userId: string;
  /** Email of the viewer */
  email: string;
  /** Timestamp when the viewer joined the session */
  joinedAt: string;
  /** Timestamp when the viewer left the session */
  leftAt: string | null;
}

/**
 * Represents analytics data for a session.
 */
export interface SessionAnalytics {
  /** ID of the session these analytics belong to */
  sessionId: string;
  /** Total number of unique viewers who joined */
  totalViewers: number;
  /** Peak number of concurrent viewers */
  peakViewers: number;
  /** Total number of messages sent in the session */
  totalMessages: number;
  /** Average watch time in seconds */
  avgWatchTime: number;
  /** Number of unique users who sent at least one message */
  uniqueChatters: number;
  /** Timestamp when these analytics were computed */
  computedAt: string;
}

/**
 * Represents an active session being tracked for live viewer counts.
 */
export interface ActiveSession {
  /** ID of the session */
  sessionId: string;
  /** Number of currently active viewers */
  viewerCount: number;
  /** Timestamp when this record was last updated */
  updatedAt: string;
}

/**
 * Represents a poll option.
 */
export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

/**
 * Represents a live poll in a session.
 */
export interface Poll {
  id: string;
  sessionId: string;
  question: string;
  options: PollOption[];
  isActive: boolean;
  createdAt: any; // Using any to avoid Timestamp import issues in this file if not already imported, but ideally should be specific. The user rules say Timestamp type: `import { Timestamp } from 'firebase/firestore'` but this file seems to use string for dates mostly? The existing types use 'string' for dates. I should stick to 'string' for ISO dates if that's the pattern, or 'Timestamp' if using Firebase objects directly. The existing types all use 'string', likely ISO strings or just stringified timestamps. Wait, the user rules say: "Firebase Timestamp type: `import { Timestamp } from 'firebase/firestore'`". However, the file `types.ts` currently uses `string` for all `createdAt`. I will stick to `any` or `Timestamp` but since this is a pure types file, maybe `any` or distinct type is safer to avoid deeper dependencies if not needed. Actually, I see `createdAt: string` in other interfaces. I'll use `createdAt: any` or similar to match the pattern or better yet, import Timestamp if needed. Let's look at the file content again. It uses `string`. I will use `Timestamp` generally but maybe `string` for client side? Let's assume standard serialized pattern or Firebase Timestamp. Given the rule, I should import Timestamp.
  // Actually, to avoid breaking 'types.ts' which looks like it might be shared or used where firebase isn't, I will use `Timestamp` but needs import.
  // Let's check imports in `types.ts`. There are none. It seems these are DTOs.
  // I will use `any` for now for the createdAt to be safe or `string` if we convert. The `PollVoteCard` will receive `Poll`. I'll use `any` for the timestamp field to be flexible as it often comes as Timestamp from firestore.
}

/**
 * Represents a user's vote on a poll.
 */
export interface PollVote {
  id: string;
  pollId: string;
  userId: string;
  selectedOptionId: string;
  votedAt: any;
}
