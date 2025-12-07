
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// This function is the new single point of entry for client-side Firebase initialization.
// It ensures that we fetch a valid configuration before attempting to initialize the app.
export async function initializeFirebaseOnClient(): Promise<{ app: FirebaseApp; auth: Auth; db: Firestore; }> {
  // If the app is already initialized, return the existing services.
  if (getApps().length > 0) {
    const app = getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);
    return { app, auth, db };
  }

  // Construct the Firebase config from environment variables
  // This is a more direct and reliable method for Next.js apps.
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };


  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    const errorMessage = "Firebase environment variables are not set. Please check your NEXT_PUBLIC_FIREBASE_* variables.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  try {
    // Initialize the app with the config from environment variables.
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    return { app, auth, db };
  } catch (error) {
    console.error("Firebase client initialization failed:", error);
    // Propagate the error to be handled by the UI.
    throw error;
  }
}
