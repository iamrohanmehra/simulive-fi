---
trigger: always_on
---

# Simulive Platform - Cursor AI Rules

## Project Overview

Simulive (simulated live) streaming platform where pre-recorded videos are
synchronized to server time, creating a "live" experience. Users see the same
video position at any moment with real-time chat.

## Stack

- **Runtime**: Bun | **Frontend**: Vite + React 18 + TypeScript
- **UI**: shadcn/ui (Mira Compact, Zinc/Indigo, Dark) + Tailwind
- **Backend**: Firebase (Firestore + Auth + Functions)
- **Video**: Vidstack (simulive mode) + HLS
- **Real-time**: Firestore onSnapshot
- **Routing**: React Router DOM v6
- **Icons**: Lucide | **Font**: Inter

## Core Concept Rules

### Simulive Video (CRITICAL)

- Videos MUST sync to server time, NOT user's local time
- Calculate: `liveOffset = serverTime - scheduledStart`
- Seek videos to `liveOffset`, never to beginning
- Drift correction: if |videoTime - expectedTime| > 250ms, re-sync
- NO pause, seek, speed controls - completely disabled
- Dual video: main (screen) + PiP (face cam), both synced

### Session States (State Machine)

```typescript
type SessionState = "scheduled" | "live" | "ended";

// scheduled → show CountdownScreen
// live → show DualVideoPlayer + Chat
// ended → show SessionEndedScreen
```

## Bun Commands

```bash
bun install          # Install deps
bun run dev          # Dev server
bun run build        # Production build
bun add <pkg>        # Add dependency
```

## Code Conventions

### TypeScript

- Explicit types for all params/returns | `interface` for objects, `type` for
  unions
- Never `any`, use `unknown` + guards | Strict mode enabled
- Firebase Timestamp type: `import { Timestamp } from 'firebase/firestore'`

### React Patterns

- Functional components only | Props: `ComponentNameProps` interface
- Hooks order: router → context → state → refs → custom
- Export default at end | Early returns for loading/error

### File Structure

```
src/
├── components/       # UI components
├── contexts/         # AuthContext
├── hooks/            # useSession, useServerTimeSync, etc.
├── lib/              # firebase.ts, types.ts, utils
├── pages/            # Route components
└── App.tsx
```

## Firebase Patterns

### Firestore Queries (Always handle errors)

```typescript
// ✅ CORRECT: Error handling + real-time
const unsubscribe = onSnapshot(
    collection(db, "messages"),
    (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        setMessages(data);
    },
    (error) => {
        console.error("Firestore error:", error);
        toast.error(error.message);
    },
);
return () => unsubscribe();

// ❌ WRONG: No error handling, no cleanup
onSnapshot(collection(db, "messages"), (snapshot) => {
    setMessages(snapshot.docs);
});
```

### Server Time (CRITICAL)

```typescript
// ✅ CORRECT: Use Firestore serverTimestamp
import { serverTimestamp } from "firebase/firestore";

await setDoc(doc(db, "messages", id), {
    content: message,
    createdAt: serverTimestamp(), // Server time, not Date.now()
});

// ❌ WRONG: Client time (causes sync issues)
createdAt: new Date(); // Don't use client time
```

### Real-time Subscriptions (Always cleanup)

```typescript
// ✅ CORRECT: Cleanup in useEffect
useEffect(() => {
    const unsubscribe = onSnapshot(docRef, (doc) => {
        setData(doc.data());
    });
    return () => unsubscribe(); // Cleanup
}, [docId]);

// ❌ WRONG: No cleanup (memory leak)
useEffect(() => {
    onSnapshot(docRef, (doc) => setData(doc.data()));
}, []);
```

### Firestore Security Rules

- Never bypass security rules with admin SDK on client
- Test rules with Firebase Emulator
- Guest support: allow null userId in viewer_sessions
- Example:

```javascript
// Allow users to read their own viewer sessions
match /viewer_sessions/{sessionId} {
  allow read: if request.auth.uid == resource.data.userId 
    || resource.data.userId == null;
}
```

## Vidstack Simulive Mode

### Player Configuration

```typescript
// ✅ CORRECT: Force live mode
import { MediaPlayer, MediaProvider } from '@vidstack/react'

<MediaPlayer
  src={videoUrl}
  streamType="live"        // ← CRITICAL: Forces live UI
  autoPlay={hasJoined}     // Only after user gesture
  playsInline
  controls={false}         // ← No user controls
  onTimeUpdate={handleSync} // For drift correction
>
  <MediaProvider />
</MediaPlayer>

// ❌ WRONG: VOD mode exposes duration
<MediaPlayer src={url} /> // Missing streamType="live"
```

### Disable ALL Controls

```typescript
// ✅ CORRECT: Completely locked down
<MediaPlayer
  controls={false}
  disablePictureInPicture
  onContextMenu={(e) => e.preventDefault()} // No right-click
  playsInline // Mobile inline playback
/>

// ❌ WRONG: Users can pause/seek
<MediaPlayer controls={true} />
```

### Drift Correction

```typescript
// Check every 5 seconds
useEffect(() => {
    const interval = setInterval(() => {
        const expectedTime = liveOffset;
        const actualTime = videoRef.current?.currentTime ?? 0;
        const drift = Math.abs(expectedTime - actualTime);

        if (drift > 0.25) { // >250ms drift
            videoRef.current.currentTime = expectedTime;
            console.log("Drift corrected:", drift);
        }
    }, 5000);

    return () => clearInterval(interval);
}, [liveOffset]);
```

## Component Patterns

### Session State Machine

```typescript
// ✅ CORRECT: Clear state-based rendering
function SessionPage() {
    const { sessionState, session } = useSessionState(sessionId);

    if (sessionState === "scheduled") {
        return <CountdownScreen scheduledStart={session.scheduledStart} />;
    }

    if (sessionState === "live") {
        return <DualVideoPlayer session={session} />;
    }

    return <SessionEndedScreen session={session} />;
}

// ❌ WRONG: Nested ternaries
return sessionState === "scheduled"
    ? <Countdown />
    : sessionState === "live"
    ? <Video />
    : <Ended />;
```

### Auth Modals Flow

```typescript
// User flow: EmailVerificationModal → JoinSessionModal → Session
const [showEmailModal, setShowEmailModal] = useState(!isVerified);
const [showJoinModal, setShowJoinModal] = useState(false);
const [hasJoined, setHasJoined] = useState(false);

// Only show session after hasJoined = true (provides user gesture for audio)
```

### Chat Message Rate Limiting

```typescript
// ✅ CORRECT: 6-second cooldown
const lastMessageTime = useRef(0);

async function sendMessage(content: string) {
    const now = Date.now();
    if (now - lastMessageTime.current < 6000) {
        throw new Error("Please wait before sending another message");
    }
    lastMessageTime.current = now;

    await addDoc(collection(db, "messages"), {
        content: content.trim().slice(0, 500), // Max 500 chars
        createdAt: serverTimestamp(),
    });
}
```

## Custom Hooks Patterns

### Server Time Sync Hook

```typescript
export function useServerTimeSync(
    sessionId: string,
    scheduledStart: Timestamp,
) {
    const [liveOffset, setLiveOffset] = useState(0);

    useEffect(() => {
        async function sync() {
            const serverTime = await getServerTime(); // Firestore timestamp
            const offset =
                (serverTime.getTime() - scheduledStart.toDate().getTime()) /
                1000;
            setLiveOffset(Math.max(0, offset)); // Never negative
        }

        sync();
        const interval = setInterval(sync, 30000); // Re-sync every 30s
        return () => clearInterval(interval);
    }, [sessionId]);

    return { liveOffset };
}
```

### Viewer Tracking Hook

```typescript
export function useViewerTracking(sessionId: string, userId?: string) {
    useEffect(() => {
        const viewerRef = doc(collection(db, "viewer_sessions"));

        // Create viewer session
        setDoc(viewerRef, {
            sessionId,
            userId: userId ?? null,
            joinedAt: serverTimestamp(),
            leftAt: null,
        });

        // Update on unmount
        return () => {
            updateDoc(viewerRef, { leftAt: serverTimestamp() });
        };
    }, [sessionId, userId]);
}
```

## Styling (Mira Compact)

### Tailwind Conventions

```typescript
// ✅ CORRECT: Grouped classes
<div className="flex items-center justify-between p-4 border-b bg-card">
  <h2 className="text-lg font-semibold text-foreground">Title</h2>
</div>

// Use indigo for primary actions (theme color)
<Button className="bg-indigo-600 hover:bg-indigo-700">Join</Button>
```

### Dark Mode (System-based)

- Default dark theme | Use `dark:` prefix for overrides
- CSS variables: `bg-background`, `text-foreground`, `text-muted-foreground`

## Error Handling

### Firebase Operations

```typescript
// ✅ CORRECT: Try-catch + toast
try {
    await addDoc(collection(db, "messages"), data);
    toast.success("Message sent");
} catch (error) {
    console.error("Send failed:", error);
    toast.error(error instanceof Error ? error.message : "Failed to send");
}

// ❌ WRONG: Silent failure
await addDoc(collection(db, "messages"), data); // No error handling
```

## Security Rules

### Input Validation

```typescript
// ✅ CORRECT: Validate before Firestore
function sendMessage(content: string) {
    if (!content.trim()) throw new Error("Empty message");
    if (content.length > 500) throw new Error("Message too long");

    return addDoc(collection(db, "messages"), {
        content: content.trim(),
        createdAt: serverTimestamp(),
    });
}
```

### Prevent Duplicate Sessions

```typescript
// Check active_sessions collection before allowing join
const existing = await getDocs(
    query(
        collection(db, "active_sessions"),
        where("email", "==", email),
        where("sessionId", "==", sessionId),
    ),
);

if (!existing.empty) {
    toast.error("You are already watching this session in another tab");
    return;
}
```

## Anti-Patterns (Never Do This)

```typescript
// ❌ WRONG: Using client time for sync
const offset = Date.now() - scheduledStart // Use serverTimestamp()

// ❌ WRONG: Allowing video controls
<video controls /> // Users can pause/seek

// ❌ WRONG: Not cleaning up Firestore listeners
onSnapshot(docRef, callback) // Missing return cleanup

// ❌ WRONG: Mutating Firestore data directly
messages.push(newMsg); setMessages(messages) 
// Use: setMessages([...messages, newMsg])

// ❌ WRONG: Starting video from beginning
videoRef.current.currentTime = 0
// Use: videoRef.current.currentTime = liveOffset

// ❌ WRONG: Exposing video duration
streamType="vod" // Use streamType="live"

// ❌ WRONG: Not handling offline/reconnection
// Always show connection status and handle Firestore offline mode
```

## Performance

### Firestore Query Limits

```typescript
// ✅ Limit initial query, paginate
const q = query(
    collection(db, "messages"),
    orderBy("createdAt", "desc"),
    limit(50), // Initial 50, load more on scroll
);
```

### Memoization

```typescript
// ✅ Memoize expensive calculations
const sortedMessages = useMemo(
    () => messages.sort((a, b) => a.createdAt - b.createdAt),
    [messages],
);

// ❌ Don't over-memoize
const userName = useMemo(() => user?.name, [user]); // Just use user?.name
```

## Testing Checklist

- [ ] Server time sync works (check multiple devices)
- [ ] Drift correction triggers at >250ms
- [ ] Videos can't be paused/seeked
- [ ] Chat updates in real-time
- [ ] Rate limiting works (6s cooldown)
- [ ] Countdown auto-transitions to live
- [ ] Mobile: no duration shown in notification bar
- [ ] Guest users can join and chat
- [ ] Active session gating prevents duplicates

## Deployment

### Build

```bash
bun run build       # Production build
bun run preview     # Test locally
```

### Pre-Deploy

- [ ] Firebase project created | [ ] Firestore enabled
- [ ] Auth enabled (Email/Password) | [ ] Rules deployed
- [ ] Indexes created | [ ] Env vars set
- [ ] Test on mobile (duration hidden)

## Key Principles

- **Server Time is Truth**: Never trust client time for sync
- **No User Control**: Videos are strictly time-locked
- **Real-time First**: All updates via Firestore listeners
- **Guest Support**: Allow null userId throughout
- **Mobile Simulive**: Must hide duration on all devices

**References**: Firebase docs | Vidstack docs | React docs | Bun docs

**Remember**: This is a simulive platform - the illusion of "live" depends on
perfect time sync and no user controls.
