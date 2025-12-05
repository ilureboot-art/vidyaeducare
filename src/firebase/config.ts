
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// --- 1. Firebase Configuration ---
export const firebaseConfig = {
  "projectId": "vidyaeducare",
  "appId": "1:759861893307:web:9c8d51835795392bc6b19e",
  "storageBucket": "vidyaeducare.appspot.com",
  "apiKey": "AIzaSyBvwttvsCmg-gL3RBXsxfhHPccIAssXWFo",
  "authDomain": "vidyaeducare.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "759861893307"
};

// --- 2. Initialize Firebase App and Services (Correct Singleton Pattern) ---
function getClientApp(): FirebaseApp {
    if (getApps().length) {
        return getApp();
    }
    const app = initializeApp(firebaseConfig);
    return app;
}

const app: FirebaseApp = getClientApp();
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };
