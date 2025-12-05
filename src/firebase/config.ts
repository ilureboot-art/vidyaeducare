
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// This configuration uses a public demo project to ensure initialization succeeds.
// For production, you should replace this with your own project's configuration.
const firebaseConfig = {
  apiKey: "AIzaSyARX4ziyytJoYRgSj1Sevq0dGIxLO7PRiY",
  authDomain: "next-on-firebase-serverless-c5a7e.firebaseapp.com",
  projectId: "next-on-firebase-serverless-c5a7e",
  storageBucket: "next-on-firebase-serverless-c5a7e.appspot.com",
  messagingSenderId: "939956486427",
  appId: "1:939956486427:web:05c7b5065a57262f3f035f"
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
  } else {
    // This will throw an error if the environment variables are not set,
    // which is a good thing because it immediately tells you what's wrong.
    throw new Error("Firebase configuration is missing or incomplete.");
  }
} else {
  // If the app is already initialized, just get the existing instances.
  app = getApp();
}

auth = getAuth(app);
db = getFirestore(app);

export { app, auth, db };
