
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, type User, type Auth } from 'firebase/auth';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import type { Admin } from '@/lib/admin-data';
import { Loader2 } from 'lucide-react';
import { getFirebase } from '@/firebase/client'; // Use the new dedicated hook

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isHeadAdmin: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);
const FirebaseServicesContext = createContext<{ auth: Auth; db: Firestore; } | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [services] = useState(getFirebase()); // Initialize once and hold the reference
  const [authState, setAuthState] = useState<Omit<AuthState, 'loading'>>({
    user: null,
    isAdmin: false,
    isHeadAdmin: false,
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // services are guaranteed to be initialized here.
    const { auth, db } = services;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
  }, [services]); // Dependency on services ensures it runs once services are available.

  const authContextValue = useMemo(() => ({
    ...authState,
    loading: isAuthLoading,
  }), [authState, isAuthLoading]);

  const firebaseServicesContextValue = useMemo(() => ({
    auth: services.auth,
    db: services.db,
  }), [services]);

  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <FirebaseServicesContext.Provider value={firebaseServicesContextValue}>
        {children}
      </FirebaseServicesContext.Provider>
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

// These hooks provide direct access to the initialized services
export const useFirebaseServices = () => {
    const context = useContext(FirebaseServicesContext);
    if(context === undefined) {
        throw new Error('useFirebaseServices must be used within a FirebaseProvider');
    }
    return context;
};

export const useAuthService = (): Auth => {
    const { auth } = useFirebaseServices();
    return auth;
}
export const useDbService = (): Firestore => {
    const { db } = useFirebaseServices();
    return db;
}
