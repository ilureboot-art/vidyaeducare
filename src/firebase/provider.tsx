"use client";

import { createContext, useContext, ReactNode } from "react";
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { firebaseConfig } from "./config";

// --- Firebase Services Context ---
interface FirebaseContextType {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

let firebaseApp: FirebaseApp;
let firestore: Firestore;
let auth: Auth;

if (typeof window !== "undefined" && !getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
    firestore = getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);
    
    enableIndexedDbPersistence(firestore).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn("Firestore persistence failed: multiple tabs open.");
        } else if (err.code == 'unimplemented') {
            console.warn("Firestore persistence not supported in this browser.");
        }
    });
} else if (typeof window !== 'undefined') {
    firebaseApp = getApp();
    firestore = getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);
}


export function FirebaseProvider({ children }: { children: ReactNode }) {
    // This check is necessary for server components, though the provider is client-side.
    if (typeof window === "undefined") {
        return <>{children}</>;
    }

    const services = { app: firebaseApp, db: firestore, auth };

    return (
        <FirebaseContext.Provider value={services}>
            {children}
        </FirebaseContext.Provider>
    );
}

// Hooks to access Firebase services
export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
};

export const useFirebaseApp = (): FirebaseApp => useFirebase().app;
export const useFirestore = (): Firestore => useFirebase().db;
export const useAuthService = (): Auth => useFirebase().auth;
