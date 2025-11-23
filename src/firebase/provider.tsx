
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore, enableIndexedDbPersistence, doc, getDoc } from "firebase/firestore";
import { getAuth, type Auth, onAuthStateChanged, type User } from "firebase/auth";
import { firebaseConfig } from "./config";
import type { Admin } from '@/lib/admin-data';

// --- Initialization ---
// This function is now self-contained within the provider file to prevent circular dependencies.
function initializeFirebase() {
    if (getApps().length > 0) {
        const app = getApp();
        const db = getFirestore(app);
        const auth = getAuth(app);
        return { app, db, auth };
    }
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    if (typeof window !== 'undefined') {
        try {
            enableIndexedDbPersistence(db).catch((err) => {
                 if (err.code == 'failed-precondition') {
                    console.warn('Firestore persistence failed: multiple tabs open.');
                } else if (err.code == 'unimplemented') {
                    console.warn('Firestore persistence not supported in this browser.');
                }
            });
        } catch (error) {
            console.error("Error enabling Firestore persistence:", error);
        }
    }
    
    return { app, db, auth };
}


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
    // Services are initialized once and memoized.
    const firebaseServices = useMemo(() => initializeFirebase(), []);

    const [authState, setAuthState] = useState<Omit<AuthState, 'loading'>>({
        user: null,
        isAdmin: false,
        isHeadAdmin: false,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const { auth, db } = firebaseServices;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [firebaseServices]);

    const contextValue = useMemo(() => ({
        ...firebaseServices,
        ...authState,
        loading: isLoading,
    }), [firebaseServices, authState, isLoading]);
    
    // Only show loading fallback on initial auth load
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
