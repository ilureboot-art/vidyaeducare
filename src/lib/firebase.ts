
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

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Initialize Firebase
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

auth = getAuth(app);
db = getFirestore(app);

// Enable persistence
if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db, {
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
    }).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn(
                'Firestore persistence failed: Multiple tabs open, persistence can only be enabled in one tab at a time.'
            );
        } else if (err.code === 'unimplemented') {
            console.warn(
                'Firestore persistence failed: The current browser does not support all of the features required to enable persistence.'
            );
        } else {
            console.error("Firebase persistence error", err);
        }
    });
}


export { app, auth, db };
