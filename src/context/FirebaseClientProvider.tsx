
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getFirebaseServices } from '@/lib/firebase';
import { type FirebaseApp } from "firebase/app";
import { onAuthStateChanged, type Auth, type User } from "firebase/auth";
import { doc, getDoc, type Firestore } from "firebase/firestore";
import type { Admin } from '@/lib/admin-data';

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
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
        throw new Error("useAuth must be used within a FirebaseClientProvider");
    }
    return context;
}

// --- Firebase Services Context ---
interface FirebaseContextType {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseClientProvider");
  }
  return context;
}

// --- Combined Provider ---
export function FirebaseClientProvider({ 
  children,
  loadingFallback
}: { 
  children: ReactNode,
  loadingFallback: ReactNode 
}) {
  const [services, setServices] = useState<FirebaseContextType | null>(null);
  const [authContext, setAuthContext] = useState<AuthContextType>({
    user: null,
    loading: true,
    isAdmin: false,
    isHeadAdmin: false,
  });

  useEffect(() => {
    const initialize = async () => {
        const initializedServices = await getFirebaseServices();
        setServices(initializedServices);
        
        const { auth, db } = initializedServices;
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const adminDocRef = doc(db, "admins", user.uid);
                const adminDocSnap = await getDoc(adminDocRef);
                const isAdmin = adminDocSnap.exists() && adminDocSnap.data().status === 'Active';
                const isHeadAdmin = isAdmin && (adminDocSnap.data() as Admin).role === 'Head Admin';

                setAuthContext({ user, isAdmin, isHeadAdmin, loading: false });
            } else {
                setAuthContext({ user: null, isAdmin: false, isHeadAdmin: false, loading: false });
            }
        });

        return () => unsubscribe();
    };
    
    initialize();
  }, []);

  if (!services || authContext.loading) {
    return <>{loadingFallback}</>;
  }

  return (
    <FirebaseContext.Provider value={services}>
      <AuthContext.Provider value={authContext}>
        {children}
      </AuthContext.Provider>
    </FirebaseContext.Provider>
  );
}
