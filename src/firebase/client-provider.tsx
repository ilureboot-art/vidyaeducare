
'use client';

import { useState, useEffect } from 'react';
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import { FirebaseProvider } from './provider';

// This component's sole purpose is to initialize Firebase on the client
// and then render the real provider, passing the initialized services as props.
// This guarantees that Firebase is ready before any child component attempts to use it.

let firebaseApp: FirebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
    // The FirebaseProvider now takes the initialized services as props
    // and is only responsible for managing auth state.
    return (
        <FirebaseProvider auth={auth} db={db}>
            {children}
        </FirebaseProvider>
    );
}
