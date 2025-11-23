
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { firebaseConfig } from '@/lib/firebase';
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { onAuthStateChanged, getAuth, type Auth, type User } from "firebase/auth";
import { doc, getDoc, getFirestore, enableIndexedDbPersistence, type Firestore } from "firebase/firestore";
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
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    // This function will only be called once.
    const initializeServices = async () => {
      try {
        await enableIndexedDbPersistence(db);
      } catch (err: any) {
        if (err.code === 'failed-precondition') {
          console.warn('Firestore persistence failed: Multiple tabs open.');
        } else if (err.code === 'unimplemented') {
          console.warn('Firestore persistence failed: Browser does not support it.');
        }
      }

      setServices({ app, auth, db });

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

      // The unsubscribe function will be called when the component unmounts.
      return unsubscribe;
    };

    const unsubscribePromise = initializeServices();

    return () => {
        unsubscribePromise.then(unsubscribe => {
            if (unsubscribe) {
                unsubscribe();
            }
        });
    };
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
