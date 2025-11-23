// IMPORTANT: This file should only be imported on the client side.
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

let firebaseServices: FirebaseServices | null = null;

export const getFirebase = (): FirebaseServices => {
  if (firebaseServices) {
    return firebaseServices;
  }

  if (getApps().length === 0) {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    firebaseServices = { app, auth, db };
  } else {
    const app = getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);
    firebaseServices = { app, auth, db };
  }
  
  return firebaseServices;
};
