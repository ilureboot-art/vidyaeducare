
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import type { Admin } from '@/lib/admin-data';
import { auth, db } from './client'; // Import pre-initialized services

// 1. Auth Context and Provider
interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isHeadAdmin: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<Omit<AuthState, 'loading'>>({
    user: null,
    isAdmin: false,
    isHeadAdmin: false,
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged is now guaranteed to work because `auth` is pre-initialized
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
  }, []);

  const authContextValue = useMemo(() => ({
    ...authState,
    loading: isAuthLoading,
  }), [authState, isAuthLoading]);

  // We don't show a loader here anymore at the top level, 
  // because the layout needs to render.
  // Individual consuming components or layouts can show loaders.

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// 2. Public Hooks
export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context;
};

export const useAuthService = () => auth;
export const useDbService = () => db;
