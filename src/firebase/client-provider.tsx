
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import { auth, db } from './config'; // Import the guaranteed-to-be-initialized services
import type { Admin } from '@/lib/admin-data';
import { Loader2 } from 'lucide-react';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isHeadAdmin: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<Omit<AuthState, 'loading'>>({
    user: null,
    isAdmin: false,
    isHeadAdmin: false,
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // Now that 'auth' and 'db' are imported from a module that correctly initializes them,
    // we can safely use them in this effect.
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
  }, []);

  const authContextValue = useMemo(() => ({
    ...authState,
    loading: isAuthLoading,
  }), [authState, isAuthLoading]);

  // The loading check is now very simple.
  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center h-screen w-screen">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseClientProvider');
  }
  return context;
};

// These hooks directly provide the imported, stable services.
export const useAuthService = (): Auth => auth;
export const useDbService = (): Firestore => db;
