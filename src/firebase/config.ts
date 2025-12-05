
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// This configuration is now loaded from environment variables.
// Ensure your .env file is populated with the correct values.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// This pattern ensures that Firebase is initialized only once.
if (getApps().length === 0) {
  // Check if all required environment variables are present before initializing
  if (
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  ) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    // This will throw an error if the environment variables are not set,
    // which is a good thing because it immediately tells you what's wrong.
    throw new Error("Firebase configuration is missing. Please check your .env file.");
  }
} else {
  // If the app is already initialized, just get the existing instances.
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
