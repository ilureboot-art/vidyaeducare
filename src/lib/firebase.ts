
'use client';

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from "firebase/firestore";

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
let persistenceEnabled = false;

const initializeFirebase = async (): Promise<FirebaseServices> => {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    if (typeof window !== 'undefined' && !persistenceEnabled) {
        try {
            await enableIndexedDbPersistence(db, { cacheSizeBytes: CACHE_SIZE_UNLIMITED });
            persistenceEnabled = true;
        } catch (err: any) {
            if (err.code === 'failed-precondition') {
                console.warn('Firestore persistence failed: Multiple tabs open.');
            } else if (err.code === 'unimplemented') {
                console.warn('Firestore persistence failed: Browser does not support it.');
            }
        }
    }

    return { app, auth, db };
};

export const getFirebase = async (): Promise<FirebaseServices> => {
    if (!firebaseServices) {
        firebaseServices = await initializeFirebase();
    }
    return firebaseServices;
};
