import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    getDocs,
    deleteDoc,
    doc,
} from "firebase/firestore";

// Firebase config - update with your actual config
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections to clear
const COLLECTIONS = [
    "sessions",
    "messages",
    "viewer_sessions",
    "session_analytics",
    "active_sessions",
    "polls",
    "poll_votes",
];

async function clearCollection(collectionName: string) {
    console.log(`\n🗑️  Clearing collection: ${collectionName}`);

    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const deletePromises = querySnapshot.docs.map((document) =>
            deleteDoc(doc(db, collectionName, document.id)),
        );

        await Promise.all(deletePromises);
        console.log(
            `✅ Deleted ${querySnapshot.size} documents from ${collectionName}`,
        );
    } catch (error) {
        console.error(`❌ Error clearing ${collectionName}:`, error);
    }
}

async function clearAllData() {
    console.log("🚀 Starting Firestore cleanup...\n");
    console.log("⚠️  This will delete ALL data from the following collections:");
    console.log(COLLECTIONS.join(", "));
    console.log("\nProceeding in 3 seconds...\n");

    await new Promise((resolve) => setTimeout(resolve, 3000));

    for (const collectionName of COLLECTIONS) {
        await clearCollection(collectionName);
    }

    console.log("\n✨ Firestore cleanup complete!");
    process.exit(0);
}

clearAllData();
