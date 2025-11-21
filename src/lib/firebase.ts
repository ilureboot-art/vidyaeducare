
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

// This function must be awaited.
export const getFirebaseServices = async (): Promise<FirebaseServices> => {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // This is the critical change: We MUST await the completion of persistence setup.
    // This was the root cause of all the "client is offline" errors.
    try {
        await enableIndexedDbPersistence(db);
    } catch (err: any) {
        if (err.code === 'failed-precondition') {
            console.warn('Firestore persistence failed: Multiple tabs open. App will still function with in-memory cache.');
        } else if (err.code === 'unimplemented') {
            console.warn('Firestore persistence failed: Browser does not support it. App will still function with in-memory cache.');
        }
    }

    return { app, auth, db };
};
