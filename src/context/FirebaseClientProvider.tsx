
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getFirebaseServices } from '@/lib/firebase';
import { type FirebaseApp } from "firebase/app";
import { type Auth } from "firebase/auth";
import { type Firestore } from "firebase/firestore";

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

// DEPRECATED - This is now handled in AppLayout
// This context and provider are kept for compatibility to avoid breaking other components that might use it,
// but the logic is effectively moved.
interface AuthContextType {
  user: null;
  loading: boolean;
  isAdmin: boolean;
  isHeadAdmin: boolean;
}
const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAdmin: false,
    isHeadAdmin: false,
});

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        // This should not happen if AppLayout is correctly managing auth state.
        // We'll return a default non-authed state to prevent crashes.
        return { user: null, loading: true, isAdmin: false, isHeadAdmin: false };
    }
    return context;
}
