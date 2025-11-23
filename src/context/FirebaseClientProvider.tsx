
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getFirebaseServices } from '@/lib/firebase';
import { type FirebaseApp } from "firebase/app";
import { type Auth } from "firebase/auth";
import { type Firestore } from "firebase/firestore";
import { AuthContext } from './AuthContext';

interface FirebaseContextType {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseClientProvider({ 
  children,
  loadingFallback
}: { 
  children: ReactNode,
  loadingFallback: ReactNode 
}) {
  const [services, setServices] = useState<FirebaseContextType | null>(null);

  useEffect(() => {
    const initialize = async () => {
        const initializedServices = await getFirebaseServices();
        setServices(initializedServices);
    };
    
    initialize();
  }, []);

  if (!services) {
    return <>{loadingFallback}</>;
  }

  return (
    <FirebaseContext.Provider value={services}>
      {children}
    </FirebaseContext.Provider>
  );
}

// Hook to access Firebase services (app, auth, db)
export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseClientProvider");
  }
  return context;
}

// Hook to access auth state
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthContext.Provider");
    }
    return context;
}

    