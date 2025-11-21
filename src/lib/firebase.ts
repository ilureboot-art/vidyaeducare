
'use client';

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "vidyaeducare",
  "appId": "1:759861893307:web:9c8d51835795392bc6b19e",
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

// A simple, non-promise-based initialization.
const initializeFirebase = (): FirebaseServices => {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    // This is the crucial part for offline persistence.
    // In a client-side only context, we can call it directly.
    // The provider will ensure this only runs once.
    try {
        enableIndexedDbPersistence(db);
    } catch (err: any) {
        if (err.code === 'failed-precondition') {
            console.warn('Firestore persistence failed: Multiple tabs open.');
        } else if (err.code === 'unimplemented') {
            console.warn('Firestore persistence failed: Browser does not support it.');
        }
    }
    
    return { app, auth, db };
};

let firebaseServices: FirebaseServices | null = null;

// Export a function that ensures initialization is only called once.
export const getFirebaseServices = (): FirebaseServices => {
    if (!firebaseServices) {
        firebaseServices = initializeFirebase();
    }
    return firebaseServices;
};
