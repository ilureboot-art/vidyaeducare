
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Synchronously initializes Firebase services.
 * Using synchronous initialization with process.env ensures that the app 
 * doesn't wait for a configuration fetch on every load, significantly 
 * speeding up the "Connecting..." phase.
 */
export function getFirebaseServices(): { app: FirebaseApp; auth: Auth; db: Firestore; } {
  // If the app is already initialized, return the existing services immediately.
  if (getApps().length > 0) {
    const app = getApp();
    const auth = getAuth(app);
    // Ensure the custom database ID is used even on hot-reload/existing app
    const db = getFirestore(app, "vidyaeducaredatabase");
    return { app, auth, db };
  }

  // Construct the Firebase config from environment variables
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    const errorMessage = "Firebase environment variables are not set. Check your NEXT_PUBLIC_FIREBASE_* variables.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    // Explicitly target the named database 'vidyaeducaredatabase'
    const db = getFirestore(app, "vidyaeducaredatabase");
    
    return { app, auth, db };
  } catch (error) {
    console.error("Firebase client initialization failed:", error);
    throw error;
  }
}
