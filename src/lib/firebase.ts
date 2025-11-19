
'use client';

import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "vidyaeducare",
  "appId": "1:759861893307:web:9c8d51835795392bc6b19e",
  "apiKey": "AIzaSyBvwttvsCmg-gL3RBXsxfhHPccIAssXWFo",
  "authDomain": "vidyaeducare.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "759861893307"
};

// Singleton instances
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let persistenceEnabled = false;

// Initialize Firebase App and Auth
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

auth = getAuth(app);

// Asynchronously initialize Firestore with persistence
const initializeFirestore = async (): Promise<Firestore> => {
    if (db && persistenceEnabled) {
        return db;
    }

    const firestoreInstance = getFirestore(app);

    if (typeof window !== 'undefined' && !persistenceEnabled) {
        try {
            await enableIndexedDbPersistence(firestoreInstance, {
                cacheSizeBytes: CACHE_SIZE_UNLIMITED
            });
            persistenceEnabled = true;
            console.log("Firestore persistence enabled.");
        } catch (err: any) {
            if (err.code === 'failed-precondition') {
                console.warn('Firestore persistence failed: Multiple tabs open. App will work in online-only mode.');
            } else if (err.code === 'unimplemented') {
                console.warn('Firestore persistence failed: Browser does not support persistence.');
            } else {
                console.error("Firebase persistence error", err);
            }
        }
    }
    db = firestoreInstance;
    return db;
};

// Export the initialized app and auth, and a function to get the initialized db
export { app, auth };

// Use a promise to ensure db is not used before persistence is set up.
const dbPromise = initializeFirestore();
export { dbPromise as db };
