
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import type { Admin } from '@/lib/admin-data';
import { Loader2 } from 'lucide-react';
import { initializeFirebaseOnClient } from './client-init';

interface FirebaseServices {
    app: any;
    auth: Auth;
    db: Firestore;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isHeadAdmin: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);
const DbContext = createContext<Firestore | undefined>(undefined);
const AuthServiceContext = createContext<Auth | undefined>(undefined);


export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<FirebaseServices | null>(null);
  const [authState, setAuthState] = useState<Omit<AuthState, 'loading'>>({
    user: null,
    isAdmin: false,
    isHeadAdmin: false,
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeFirebaseOnClient()
      .then(firebaseServices => {
        setServices(firebaseServices);
      })
      .catch(err => {
        console.error(err);
        setError("Could not connect to Firebase. Please check your configuration.");
      });
  }, []);

  useEffect(() => {
    if (!services) return;

    const { auth, db } = services;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthLoading(true);
      if (user) {
        try {
          const adminDocRef = doc(db, "admins", user.uid);
          const adminDocSnap = await getDoc(adminDocRef);
          const isAdmin = adminDocSnap.exists() && adminDocSnap.data().status === 'Active';
          const isHeadAdmin = isAdmin && (adminDocSnap.data() as Admin).role === 'Head Admin';
          setAuthState({ user, isAdmin, isHeadAdmin });
        } catch (e) {
          console.error("Error checking admin status:", e);
          setAuthState({ user, isAdmin: false, isHeadAdmin: false });
        }
      } else {
        setAuthState({ user: null, isAdmin: false, isHeadAdmin: false });
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, [services]);

  const authContextValue = useMemo(() => ({
    ...authState,
    loading: isAuthLoading || !services, // Loading is true if auth is loading OR services aren't ready
  }), [authState, isAuthLoading, services]);

  if (error) {
    return (
        <div className="flex flex-col gap-4 justify-center items-center h-screen bg-destructive text-destructive-foreground p-4">
            <h1 className="text-2xl font-bold">Initialization Error</h1>
            <p>{error}</p>
        </div>
    );
  }

  if (!services) {
     return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="ml-2">Connecting to services...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <DbContext.Provider value={services.db}>
        <AuthServiceContext.Provider value={services.auth}>
            {children}
        </AuthServiceContext.Provider>
      </DbContext.Provider>
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context;
};

export const useDb = (): Firestore => {
  const context = useContext(DbContext);
  if (context === undefined) {
    throw new Error('useDb must be used within a FirebaseProvider');
  }
  return context;
}

export const useAuthService = (): Auth => {
    const context = useContext(AuthServiceContext);
    if (context === undefined) {
        throw new Error('useAuthService must be used within a FirebaseProvider');
    }
    return context;
}
