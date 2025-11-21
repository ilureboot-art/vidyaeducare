'use client';

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore, enableIndexedDbPersistence, memoryLocalCache } from "firebase/firestore";

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

let services: FirebaseServices | null = null;

// This function now correctly handles initialization, ensuring it only runs once
// on the client side, and gracefully handles server-side rendering.
export const getFirebaseServices = (): FirebaseServices => {
    if (typeof window === "undefined") {
        // On the server, we can't initialize a full client-side app.
        // Return a mock or minimal implementation if needed, but for a client-heavy
        // app, we often just want to avoid errors. Here we'll return a cached
        // instance if it exists, otherwise a minimally initialized one.
        const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        return { app, auth, db };
    }

    if (!services) {
        const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        
        try {
            // Use memory cache as a fallback for enableIndexedDbPersistence
            enableIndexedDbPersistence(db, {
                synchronizeTabs: true,
                cacheSizeBytes: 10485760, // 10 MB, default
            }).catch((err) => {
                 if (err.code === 'failed-precondition') {
                    console.warn('Firestore persistence failed: Multiple tabs open. Falling back to memory cache.');
                    // In case of failure, Firestore will use in-memory cache by default.
                    // This explicitly sets it just in case.
                    getFirestore(app, { localCache: memoryLocalCache() });
                } else if (err.code === 'unimplemented') {
                    console.warn('Firestore persistence failed: Browser does not support it. Falling back to memory cache.');
                }
            });
        } catch (err: any) {
            console.error("Error enabling Firestore persistence:", err);
        }

        services = { app, auth, db };
    }

    return services;
};
