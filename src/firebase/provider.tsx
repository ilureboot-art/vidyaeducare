'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, type User, type Auth } from 'firebase/auth';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import type { Admin } from '@/lib/admin-data';
import { Loader2 } from 'lucide-react';
import { getFirebase } from './client';

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
  const [isLoading, setIsLoading] = useState(true);

  // Correctly get initialized services within the component lifecycle
  const { auth, db } = getFirebase();

  useEffect(() => {
    // Now 'auth' is guaranteed to be initialized here.
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
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]); // Add auth and db to dependency array

  const authContextValue = useMemo(() => ({
    ...authState,
    loading: isLoading,
  }), [authState, isLoading]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
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
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context;
};

// These hooks provide direct access to the initialized services
export const useFirebase = () => getFirebase();
export const useAuthService = (): Auth => getFirebase().auth;
export const useDbService = (): Firestore => getFirebase().db;
