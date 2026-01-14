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
