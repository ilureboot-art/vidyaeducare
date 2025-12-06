
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

  try {
    // Fetch the configuration from our secure API endpoint.
    const response = await fetch('/api/firebase-config');
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Firebase configuration from server.');
    }
    const firebaseConfig = await response.json();

    if (!firebaseConfig.apiKey) {
      throw new Error("Invalid Firebase configuration received from server.");
    }

    // Initialize the app with the fetched, guaranteed-valid config.
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
