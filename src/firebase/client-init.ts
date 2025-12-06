
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// This function will be called by the client-side provider.
export async function initializeFirebaseOnClient() {
  if (getApps().length > 0) {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    return { app, auth, db };
  }

  try {
    const response = await fetch('/api/firebase-config');
    if (!response.ok) {
        throw new Error('Failed to fetch Firebase configuration.');
    }
    const firebaseConfig = await response.json();

    if (!firebaseConfig.apiKey) {
      throw new Error("Invalid Firebase configuration received from server.");
    }

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    return { app, auth, db };
  } catch (error) {
    console.error("Firebase client initialization failed:", error);
    // Return null or throw error to be handled by the caller
    throw error;
  }
}
