
"use client";

import { createContext, useContext, ReactNode } from "react";
import { firebaseConfig } from "@/lib/firebase";
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

// --- Firebase Services Context ---
interface FirebaseContextType {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

let services: FirebaseContextType | null = null;

const initializeFirebaseServices = () => {
  if (services) {
    return services;
  }
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);
  
  // Enable persistence
  try {
      enableIndexedDbPersistence(db);
  } catch (error: any) {
      if (error.code === 'failed-precondition') {
          console.warn("Firestore persistence failed: Multiple tabs open.");
      } else if (error.code === 'unimplemented') {
          console.warn("Firestore persistence is not available in this browser.");
      }
  }

  services = { app, db, auth };
  return services;
};

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const firebaseServices = initializeFirebaseServices();

  return (
    <FirebaseContext.Provider value={firebaseServices}>
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
