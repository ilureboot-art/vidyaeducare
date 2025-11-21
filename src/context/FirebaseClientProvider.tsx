
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
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseClientProvider({ 
  children,
  loadingFallback
}: { 
  children: ReactNode,
  loadingFallback: ReactNode 
}) {
  const [services, setServices] = useState<FirebaseContextType | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // This effect now correctly handles the async initialization.
    const initialize = async () => {
        const initializedServices = await getFirebaseServices();
        setServices(initializedServices);
        
        const unsubscribe = onAuthStateChanged(initializedServices.auth, (user) => {
          setUser(user);
          setAuthLoading(false);
        });
        
        return unsubscribe;
    };
    
    let unsubscribe: (() => void) | undefined;
    initialize().then(unsub => {
        if (unsub) {
            unsubscribe = unsub;
        }
    });
    
    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    }
  }, []);

  const loading = authLoading || !services;

  if (loading) {
    return <>{loadingFallback}</>;
  }

  return (
    <FirebaseContext.Provider value={services}>
      <AuthContext.Provider value={{ user, loading: authLoading }}>
        {children}
      </AuthContext.Provider>
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

// Hook to access authentication state (user, loading)
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within a FirebaseClientProvider");
    }
    return context;
}
