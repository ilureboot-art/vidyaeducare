
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

let firebaseServices: FirebaseServices | null = null;

// This function is designed to be called once on the client side.
export const initializeFirebase = async (): Promise<FirebaseServices> => {
    if (firebaseServices) {
        return firebaseServices;
    }

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    try {
        await enableIndexedDbPersistence(db);
    } catch (err: any) {
        if (err.code === 'failed-precondition') {
            console.warn('Firestore persistence failed: Multiple tabs open.');
        } else if (err.code === 'unimplemented') {
            console.warn('Firestore persistence failed: Browser does not support it.');
        }
    }
    
    firebaseServices = { app, auth, db };
    return firebaseServices;
};

// Also export a non-async version for components that can't easily await it,
// though this is less safe and relies on initializeFirebase being called first.
// The provider pattern is generally better.
export const db = firebaseServices?.db || getFirestore(getApps().length === 0 ? initializeApp(firebaseConfig) : getApp());
