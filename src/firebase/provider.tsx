
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { type FirebaseApp } from "firebase/app";
import { type Firestore, doc, getDoc } from "firebase/firestore";
import { type Auth, onAuthStateChanged, type User } from "firebase/auth";
import { initializeFirebase } from "./index";
import type { Admin } from '@/lib/admin-data';

// --- Types ---
interface FirebaseServices {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isHeadAdmin: boolean;
}

// --- Contexts ---
const FirebaseContext = createContext<FirebaseServices | undefined>(undefined);
const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  isAdmin: false,
  isHeadAdmin: false,
});

// --- Provider Component ---
export function FirebaseProvider({ children, loadingFallback }: { children: ReactNode, loadingFallback: ReactNode }) {
    // Initialize Firebase services ONCE and memoize them.
    const firebaseServices = useMemo(() => initializeFirebase(), []);

    const [authContext, setAuthContext] = useState<AuthState>({
        user: null,
        loading: true,
        isAdmin: false,
        isHeadAdmin: false,
    });

    useEffect(() => {
        // Use the memoized auth service for the listener.
        const { auth, db } = firebaseServices;

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
    // The dependency array is empty to ensure this effect runs only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Show loading fallback until auth state is determined
    if (authContext.loading) {
        return <>{loadingFallback}</>;
    }
    
    return (
        <FirebaseContext.Provider value={firebaseServices}>
            <AuthContext.Provider value={authContext}>
                {children}
            </AuthContext.Provider>
        </FirebaseContext.Provider>
    );
}

// --- Hooks ---
export const useFirebase = (): FirebaseServices => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
};

export const useAuth = (): AuthState => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within a FirebaseProvider");
    }
    return context;
}

export const useFirebaseApp = (): FirebaseApp => useFirebase().app;
export const useFirestore = (): Firestore => useFirebase().db;
export const useAuthService = (): Auth => useFirebase().auth;
