
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type FirebaseApp } from "firebase/app";
import { type Firestore } from "firebase/firestore";
import { type Auth, onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { app, db, authService } from "./index";
import type { Admin } from '@/lib/admin-data';

// --- Firebase Context ---
interface FirebaseContextType {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
}
const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

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

export function FirebaseProvider({ children, loadingFallback }: { children: ReactNode, loadingFallback: ReactNode }) {
    const [authContext, setAuthContext] = useState<AuthContextType>({
        user: null,
        loading: true,
        isAdmin: false,
        isHeadAdmin: false,
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(authService, async (user) => {
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
    }, []);

    if (authContext.loading) {
        return <>{loadingFallback}</>;
    }
    
    return (
        <FirebaseContext.Provider value={{ app, db, auth: authService }}>
            <AuthContext.Provider value={authContext}>
                {children}
            </AuthContext.Provider>
        </FirebaseContext.Provider>
    );
}

// --- Hooks ---
export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
};

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within a FirebaseProvider");
    }
    return context;
}

export const useFirebaseApp = (): FirebaseApp => useFirebase().app;
export const useFirestore = (): Firestore => useFirebase().db;
export const useAuthService = (): Auth => useFirebase().auth;
