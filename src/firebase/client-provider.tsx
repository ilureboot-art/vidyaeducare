
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { FirebaseProvider, useFirebase, useAuthService } from "./provider";
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

// --- Auth State Logic ---
function AuthStateProvider({ children, loadingFallback }: { children: ReactNode, loadingFallback: ReactNode }) {
    const { db } = useFirebase();
    const auth = useAuthService();
    const [authContext, setAuthContext] = useState<AuthContextType>({
        user: null,
        loading: true,
        isAdmin: false,
        isHeadAdmin: false,
    });

    useEffect(() => {
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
    }, [auth, db]);

    if (authContext.loading) {
        return <>{loadingFallback}</>;
    }

    return (
        <AuthContext.Provider value={authContext}>
            {children}
        </AuthContext.Provider>
    );
}

// --- Combined Provider ---
export function FirebaseClientProvider({ children, loadingFallback }: { children: ReactNode, loadingFallback: ReactNode }) {
  return (
    <FirebaseProvider>
      <AuthStateProvider loadingFallback={loadingFallback}>
        {children}
      </AuthStateProvider>
    </FirebaseProvider>
  );
}

// Re-export useFirebase for convenience so components can import { useAuth, useFirebase } from one place
export { useFirebase } from './provider';
