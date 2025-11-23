
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, type User, type Auth } from 'firebase/auth';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import type { Admin } from '@/lib/admin-data';
import { Loader2 } from 'lucide-react';
import { useFirebase } from '@/hooks/use-firebase'; // Use the new dedicated hook

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isHeadAdmin: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);
const FirebaseContext = createContext<{ auth: Auth | null; db: Firestore | null }>({ auth: null, db: null });

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const { app, auth, db, loading: firebaseLoading } = useFirebase();
  const [authState, setAuthState] = useState<Omit<AuthState, 'loading'>>({
    user: null,
    isAdmin: false,
    isHeadAdmin: false,
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    if (firebaseLoading || !auth || !db) return;

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
  }, [auth, db, firebaseLoading]);

  const authContextValue = useMemo(() => ({
    ...authState,
    loading: isAuthLoading || firebaseLoading,
  }), [authState, isAuthLoading, firebaseLoading]);

  const firebaseContextValue = useMemo(() => ({
    auth,
    db,
  }), [auth, db]);

  if (isAuthLoading || firebaseLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <FirebaseContext.Provider value={firebaseContextValue}>
        {children}
      </FirebaseContext.Provider>
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
    const context = useContext(FirebaseContext);
    if(context === undefined) {
        throw new Error('useFirebaseServices must be used within a FirebaseProvider');
    }
    return context;
};

export const useAuthService = (): Auth => {
    const { auth } = useFirebaseServices();
    if (!auth) throw new Error('Auth service is not available');
    return auth;
}
export const useDbService = (): Firestore => {
    const { db } = useFirebaseServices();
    if (!db) throw new Error('Firestore service is not available');
    return db;
}
