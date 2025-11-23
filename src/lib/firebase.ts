
'use client';

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "vidyaeducare",
  "appId": "1:759861893307:web:9c8d51835795392bc6b19e",
  "storageBucket": "vidyaeducare.appspot.com",
  "apiKey": "AIzaSyBvwttvsCmg-gL3RBXsxfhHPccIAssXWFo",
  "authDomain": "vidyaeducare.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "759861893307"
};

type FirebaseServices = {
    app: FirebaseApp;
    auth: Auth;
    db: Firestore;
};

// --- Singleton Pattern for Firebase Initialization ---
let firebaseServices: FirebaseServices | null = null;

const initializeFirebase = () => {
    if (typeof window === 'undefined') {
        // This check prevents running Firebase initialization on the server.
        // If you need server-side Firebase, you'd use the Admin SDK instead.
        throw new Error("Firebase cannot be initialized on the server.");
    }
    
    if (firebaseServices) {
        return firebaseServices;
    }

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Try to enable persistence. This can be done without awaiting
    // as the app can function while it's being set up.
    enableIndexedDbPersistence(db).catch((err: any) => {
        if (err.code === 'failed-precondition') {
            console.warn('Firestore persistence failed: Multiple tabs open.');
        } else if (err.code === 'unimplemented') {
            console.warn('Firestore persistence failed: Browser does not support it.');
        }
    });

    firebaseServices = { app, auth, db };
    return firebaseServices;
};

// This function is now a simple getter for the singleton instance.
export const getFirebaseServices = (): FirebaseServices => {
    return initializeFirebase();
};
