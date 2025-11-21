
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getFirebaseServices } from '@/lib/firebase';
import { type FirebaseApp } from "firebase/app";
import { type Auth, onAuthStateChanged, type User } from "firebase/auth";
import { type Firestore } from "firebase/firestore";

interface FirebaseContextType {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  user: User | null;
  loading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseClientProvider({ 
  children,
  loadingFallback
}: { 
  children: ReactNode,
  loadingFallback: ReactNode 
}) {
  const [services, setServices] = useState<{ app: FirebaseApp; auth: Auth; db: Firestore; } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // This effect runs once on mount to initialize Firebase and auth state.
    const initializedServices = getFirebaseServices();
    setServices(initializedServices);
    
    const unsubscribe = onAuthStateChanged(initializedServices.auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const loading = authLoading || !services;

  if (loading) {
    return <>{loadingFallback}</>;
  }

  return (
    <FirebaseContext.Provider value={{ ...services, user, loading: false }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseClientProvider");
  }
  return context;
}

export function useAuth() {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within a FirebaseClientProvider");
    }
    return { user: context.user, loading: context.loading };
}
