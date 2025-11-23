'use client';

import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// This function guarantees that Firebase is initialized only once.
function getFirebase() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Note: The following lines for emulators are typically used for local development.
    // They are commented out but can be enabled if you set up a local Firebase Emulator Suite.
    // if (process.env.NODE_ENV === 'development') {
    //   try {
    //      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    //      connectFirestoreEmulator(db, '127.0.0.1', 8080);
    //   } catch (e) {
    //      console.error('Error connecting to Firebase emulators. Is the emulator suite running?');
    //   }
    // }
  } else {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  }
  return { app, auth, db };
}

// Export the function that provides the initialized services.
export { getFirebase };
