
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

class FirebaseService {
  private static instance: FirebaseService;
  public readonly app: FirebaseApp;
  public readonly auth: Auth;
  public readonly db: Firestore;

  private constructor() {
    if (!getApps().length) {
      this.app = initializeApp(firebaseConfig);
    } else {
      this.app = getApp();
    }
    this.auth = getAuth(this.app);
    this.db = this.initializeFirestoreWithPersistence();
  }

  private initializeFirestoreWithPersistence(): Firestore {
    const firestoreDb = getFirestore(this.app);
    if (typeof window !== 'undefined') {
        enableIndexedDbPersistence(firestoreDb, {
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
            }
        });
    }
    return firestoreDb;
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }
}

const firebaseInstance = FirebaseService.getInstance();
const app = firebaseInstance.app;
const auth = firebaseInstance.auth;
const db = firebaseInstance.db;

export { app, auth, db };
