
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getFirebaseServices } from '@/lib/firebase';
import { type FirebaseApp } from "firebase/app";
import { type Auth, onAuthStateChanged, type User } from "firebase/auth";
import { type Firestore, doc, getDoc } from "firebase/firestore";
import type { Admin } from '@/lib/admin-data';
import { usePathname } from 'next/navigation';

interface FirebaseContextType {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isHeadAdmin: boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);
const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAdmin: false,
    isHeadAdmin: false,
});

export function FirebaseClientProvider({ 
  children,
  loadingFallback
}: { 
  children: ReactNode,
  loadingFallback: ReactNode 
}) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/forgot-password') || pathname.startsWith('/admin/login');

  const [services, setServices] = useState<FirebaseContextType | null>(null);
  const [authContext, setAuthContext] = useState<AuthContextType>({
    user: null,
    loading: !isAuthPage, // Don't show loading on auth pages initially
    isAdmin: false,
    isHeadAdmin: false,
  });

  useEffect(() => {
    const initialize = async () => {
        const initializedServices = await getFirebaseServices();
        setServices(initializedServices);
        
        // If we are on an auth page, we don't need to wait for onAuthStateChanged
        // The page itself will handle the redirect upon successful login.
        if(isAuthPage) {
          setAuthContext(prev => ({ ...prev, loading: false }));
          return () => {}; // Return empty cleanup function
        }

        const unsubscribe = onAuthStateChanged(initializedServices.auth, async (user) => {
          if (user) {
            // Check for admin status only once on auth state change
            const adminDocRef = doc(initializedServices.db, "admins", user.uid);
            const adminDocSnap = await getDoc(adminDocRef);
            if (adminDocSnap.exists() && adminDocSnap.data().status === 'Active') {
              const adminData = adminDocSnap.data() as Admin;
              setAuthContext({
                user,
                loading: false,
                isAdmin: true,
                isHeadAdmin: adminData.role === 'Head Admin',
              });
            } else {
              setAuthContext({ user, loading: false, isAdmin: false, isHeadAdmin: false });
            }
          } else {
            setAuthContext({ user: null, loading: false, isAdmin: false, isHeadAdmin: false });
          }
        });
        
        return unsubscribe;
    };
    
    let unsubscribe: (() => void) | undefined;
    initialize().then(unsub => {
        if (unsub) {
            unsubscribe = unsub;
        }
    });
    
    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    }
  }, [isAuthPage]);

  // For non-auth pages, show the main loading fallback.
  if (authContext.loading && !isAuthPage) {
    return <>{loadingFallback}</>;
  }

  // Provide the context even on auth pages so useFirebase() doesn't fail.
  if (!services) {
    // If services aren't ready yet, show a loader. This should be very brief.
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

// Hook to access Firebase services (app, auth, db)
export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseClientProvider");
  }
  return context;
}

// Hook to access authentication state (user, loading, isAdmin, isHeadAdmin)
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within a FirebaseClientProvider");
    }
    return context;
}
