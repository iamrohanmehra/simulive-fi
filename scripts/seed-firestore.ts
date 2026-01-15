
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
  addDoc
} from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Emulator configuration
const EMULATOR_HOST = "localhost";
const FIRESTORE_PORT = 8080;
const AUTH_PORT = 9099;

// Mock Firebase config (emulators don't usually require real credentials)
const firebaseConfig = {
  apiKey: "fake-api-key",
  authDomain: "localhost",
  projectId: "simulive-fi-app",
  storageBucket: "simulive-fi-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Connect to emulators
console.log(`🔌 Connecting to Firestore emulator at ${EMULATOR_HOST}:${FIRESTORE_PORT}`);
connectFirestoreEmulator(db, EMULATOR_HOST, FIRESTORE_PORT);
connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${AUTH_PORT}`);

// Helper to create timestamp relative to now
const now = new Date();
const addHours = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000);
const addMinutes = (m: number) => new Date(now.getTime() + m * 60 * 1000);

async function seedData() {
  console.log("🚀 Starting Firestore seed...\n");

  try {
    const batch = writeBatch(db);

    // 1. Users
    console.log("👤 Seeding Users...");
    const users = [
      {
        uid: "student1",
        email: "student1@test.com",
        name: "Student One",
        role: "student",
        createdAt: serverTimestamp()
      },
      {
        uid: "student2",
        email: "student2@test.com",
        name: "Student Two",
        role: "student",
        createdAt: serverTimestamp()
      },
      {
        uid: "admin1",
        email: "admin@test.com",
        name: "Admin User",
        role: "admin",
        createdAt: serverTimestamp()
      }
    ];

    for (const user of users) {
      const userRef = doc(db, "users", user.uid);
      batch.set(userRef, user);
    }

    // 2. Sessions
    console.log("📅 Seeding Sessions...");
    
    // Scheduled Session (Starts in 1 hour)
    const scheduledSessionId = "session-scheduled";
    const scheduledStart = addHours(1);
    batch.set(doc(db, "sessions", scheduledSessionId), {
      title: "Introduction to React Performance",
      description: "Learn how to optimize your React applications for maximum speed.",
      scheduledStart: Timestamp.fromDate(scheduledStart),
      isLive: false,
      chatEnabled: true,
      instructor: {
        id: "admin1",
        name: "Admin User",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin1"
      },
      createdAt: serverTimestamp(),
      videoUrl: "https://stream.mux.com/VZtzUzGRv02OhRnZCxcNg49OilvolTqdnFLEqBsTwaxU/low.mp4"
    });

    // Live Session (Started 10 mins ago)
    const liveSessionId = "session-live";
    const liveStart = addMinutes(-10);
    batch.set(doc(db, "sessions", liveSessionId), {
      title: "Advanced TypeScript Patterns",
      description: "Deep dive into generics, conditional types, and utility types.",
      scheduledStart: Timestamp.fromDate(liveStart), // Started 10 mins ago, server time will be now -> offset 10m
      isLive: true,
      chatEnabled: true,
      instructor: {
        id: "admin1",
        name: "Admin User",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin1"
      },
      createdAt: serverTimestamp(),
      videoUrl: "https://stream.mux.com/VZtzUzGRv02OhRnZCxcNg49OilvolTqdnFLEqBsTwaxU/low.mp4"
    });

    // Ended Session (Ended 1 day ago)
    const endedSessionId = "session-ended";
    const endedStart = addHours(-25);
    batch.set(doc(db, "sessions", endedSessionId), {
      title: "Web Accessibility Fundamentals",
      description: "Making your web apps accessible to everyone.",
      scheduledStart: Timestamp.fromDate(endedStart),
      isLive: false,
      chatEnabled: false,
      instructor: {
        id: "admin1",
        name: "Admin User",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin1"
      },
      createdAt: serverTimestamp(),
      endedAt: Timestamp.fromDate(addHours(-24)),
      videoUrl: "https://stream.mux.com/VZtzUzGRv02OhRnZCxcNg49OilvolTqdnFLEqBsTwaxU/low.mp4"
    });

    await batch.commit(); // Commit users and sessions first

    // 3. Messages (Bulk add for Live Session)
    console.log("💬 Seeding Messages...");
    const messages = [];
    const messageContents = [
      "Hello everyone!", "Can't wait for this to start!", "Is the audio working?",
      "Yes, loud and clear.", "This topic is exactly what I needed.", 
      "Does anyone have the link to therepo?", "Great point!", "Could you repeat that?",
      "Wow, I didn't know that!", "Thanks for the answer."
    ];

    // Add 25 messages to Live Session
    for (let i = 0; i < 25; i++) {
        const userId = i % 2 === 0 ? "student1" : "student2";
        const content = messageContents[i % messageContents.length];
        // Create messages spread over the last 10 minutes
        const timeOffset = Math.floor(Math.random() * 10);
        
        await addDoc(collection(db, "messages"), {
            sessionId: liveSessionId,
            userId: userId,
            userName: i % 2 === 0 ? "Student One" : "Student Two",
            content: `${content} (${i})`,
            createdAt: Timestamp.fromDate(addMinutes(-10 + timeOffset)),
            role: "student"
        });
    }

    // Add 25 messages to Ended Session
    for (let i = 0; i < 25; i++) {
        const userId = i % 2 === 0 ? "student1" : "student2";
        const content = messageContents[i % messageContents.length];
        
        await addDoc(collection(db, "messages"), {
            sessionId: endedSessionId,
            userId: userId,
            userName: i % 2 === 0 ? "Student One" : "Student Two",
            content: `${content} (Archive ${i})`,
            createdAt: Timestamp.fromDate(addHours(-24.5)), // During the session
            role: "student"
        });
    }

    // 4. Viewer Sessions
    console.log("👀 Seeding Viewer Sessions...");
    // Just some random active viewers for the live session
    for (let i = 0; i < 10; i++) {
        await addDoc(collection(db, "viewer_sessions"), {
            sessionId: liveSessionId,
            userId: i < 3 ? `student${i+1}` : null, // Some auth, some guest
            joinedAt: serverTimestamp(),
            leftAt: null
        });
    }

    // 5. Polls
    console.log("📊 Seeding Polls...");
    // Active Poll
    await addDoc(collection(db, "polls"), {
       sessionId: liveSessionId,
       question: "What is your experience level with TypeScript?",
       options: [
           { id: "1", text: "Beginner", votes: 2 },
           { id: "2", text: "Intermediate", votes: 5 },
           { id: "3", text: "Advanced", votes: 1 }
       ],
       isActive: true,
       createdAt: serverTimestamp(),
       createdBy: "admin1"
    });

    // Ended Poll
    await addDoc(collection(db, "polls"), {
        sessionId: liveSessionId,
        question: "Is the pace okay?",
        options: [
            { id: "1", text: "Too fast", votes: 0 },
            { id: "2", text: "Just right", votes: 8 },
            { id: "3", text: "Too slow", votes: 1 }
        ],
        isActive: false,
        createdAt: Timestamp.fromDate(addMinutes(-5)),
        createdBy: "admin1"
     });
 
     // 6. Analytics for Ended Session
     console.log("📈 Seeding Analytics...");
     await setDoc(doc(db, "session_analytics", endedSessionId), {
         sessionId: endedSessionId,
         totalViewers: 142,
         peakConcurrency: 45,
         averageWatchTime: 1250, // seconds
         totalMessages: 320,
         uniqueChatters: 56,
         computedAt: serverTimestamp()
     });

    console.log("\n✨ Database seeding complete!");
    console.log("   - 3 Users");
    console.log("   - 3 Sessions (Scheduled, Live, Ended)");
    console.log("   - 50+ Messages");
    console.log("   - 10+ Viewer Sessions");
    console.log("   - 2 Polls");
    console.log("   - 1 Analytics Record");
    
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedData();
