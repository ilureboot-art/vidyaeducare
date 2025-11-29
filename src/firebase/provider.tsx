
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import type { Admin } from '@/lib/admin-data';

// --- 1. Define Auth State and Context ---
interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isHeadAdmin: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);
const DbContext = createContext<Firestore | undefined>(undefined);
const AuthContextService = createContext<Auth | undefined>(undefined);

// --- 2. Create a Provider Component ---
// This provider now expects pre-initialized services.
export function FirebaseProvider({ 
    children,
    auth,
    db,
}: { 
    children: React.ReactNode;
    auth: Auth;
    db: Firestore;
}) {
  const [authState, setAuthState] = useState<Omit<AuthState, 'loading'>>({
    user: null,
    isAdmin: false,
    isHeadAdmin: false,
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
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
  }, [auth, db]);

  const authContextValue = useMemo(() => ({
    ...authState,
    loading: isAuthLoading,
  }), [authState, isAuthLoading]);

  return (
    <AuthContext.Provider value={authContextValue}>
      <AuthContextService.Provider value={auth}>
        <DbContext.Provider value={db}>
            {children}
        </DbContext.Provider>
      </AuthContextService.Provider>
    </AuthContext.Provider>
  );
}

// --- 3. Export Public Hooks ---
export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context;
};

export const useAuthService = (): Auth => {
  const context = useContext(AuthContextService);
  if (context === undefined) {
    throw new Error('useAuthService must be used within a FirebaseProvider');
  }
  return context;
};

export const useDbService = (): Firestore => {
  const context = useContext(DbContext);
  if (context === undefined) {
    throw new Error('useDbService must be used within a FirebaseProvider');
  }
  return context;
};
