
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { getDoc, doc } from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { db, auth, app } from './index'; // Import initialized services
import type { FirebaseApp } from "firebase/app";
import type { Firestore } from "firebase/firestore";
import type { Auth } from "firebase/auth";
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

interface FirebaseContextValue extends FirebaseServices, AuthState {}

// --- Context ---
const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

// --- Provider Component ---
export function FirebaseProvider({ children, loadingFallback }: { children: ReactNode, loadingFallback: ReactNode }) {
    const [authState, setAuthState] = useState<Omit<AuthState, 'loading'>>({
        user: null,
        isAdmin: false,
        isHeadAdmin: false,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const adminDocRef = doc(db, "admins", user.uid);
                    const adminDocSnap = await getDoc(adminDocRef);
                    const isAdmin = adminDocSnap.exists() && adminDocSnap.data().status === 'Active';
                    const isHeadAdmin = isAdmin && (adminDocSnap.data() as Admin).role === 'Head Admin';
                    setAuthState({ user, isAdmin, isHeadAdmin });
                } catch(e) {
                    console.error("Error checking admin status:", e);
                    setAuthState({ user, isAdmin: false, isHeadAdmin: false });
                }
            } else {
                setAuthState({ user: null, isAdmin: false, isHeadAdmin: false });
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const contextValue = useMemo(() => ({
        app,
        db,
        auth,
        ...authState,
        loading: isLoading,
    }), [authState, isLoading]);
    
    if (isLoading) {
        return <>{loadingFallback}</>;
    }
    
    return (
        <FirebaseContext.Provider value={contextValue}>
            {children}
        </FirebaseContext.Provider>
    );
}

// --- Hooks ---
export const useFirebase = (): FirebaseContextValue => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
};

export const useAuth = (): AuthState => {
    const context = useFirebase();
    return {
        user: context.user,
        loading: context.loading,
        isAdmin: context.isAdmin,
        isHeadAdmin: context.isHeadAdmin,
    };
}

export const useFirebaseApp = (): FirebaseApp => useFirebase().app;
export const useFirestore = (): Firestore => useFirebase().db;
export const useAuthService = (): Auth => useFirebase().auth;
