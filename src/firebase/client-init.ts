
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Synchronously initializes Firebase services.
 * We explicitly target 'vidyaeducaredatabase' to bypass the project's default Datastore settings.
 */
export function getFirebaseServices(): { app: FirebaseApp; auth: Auth; db: Firestore; } {
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

  // Use existing app if available to prevent multiple initializations
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  
  /**
   * IMPORTANT: We must use the specific name 'vidyaeducaredatabase'.
   * If your project is in Datastore mode, the (default) database is restricted.
   * Named databases are always created in Firestore Native mode.
   */
  const db = getFirestore(app, "vidyaeducaredatabase");
  
  return { app, auth, db };
}
