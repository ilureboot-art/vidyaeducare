
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import { Loader2, AlertTriangle } from 'lucide-react';
import { initializeFirebaseOnClient } from './client-init';
import type { Admin } from '@/lib/admin-data';
import { usePathname, useRouter } from 'next/navigation';

interface FirebaseServices {
    auth: Auth;
    db: Firestore;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isHeadAdmin: boolean;
}

const AuthServiceContext = createContext<Auth | undefined>(undefined);
const DbContext = createContext<Firestore | undefined>(undefined);
const AuthContext = createContext<AuthState | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<FirebaseServices | null>(null);
  const [authState, setAuthState] = useState<Omit<AuthState, 'loading'>>({
    user: null,
    isAdmin: false,
    isHeadAdmin: false,
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    initializeFirebaseOnClient()
      .then(setServices)
      .catch((err) => {
        setError(err.message || "An unknown error occurred during Firebase initialization.");
      });
  }, []);

  const checkAdminStatus = useCallback(async (user: User | null, db: Firestore) => {
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
  }, []);

  useEffect(() => {
    if (!services) return;

    const { auth, db } = services;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Don't set loading back to true if we already have a user and just refresh
      // Only set it true on initial load or logout/login events
      setIsAuthLoading(true);
      checkAdminStatus(user, db);
    });

    return () => unsubscribe();
  }, [services, checkAdminStatus]);

  const authContextValue = useMemo(() => ({
    user: authState.user,
    isAdmin: authState.isAdmin,
    isHeadAdmin: authState.isHeadAdmin,
    loading: isAuthLoading || !services,
  }), [authState, isAuthLoading, services]);

   useEffect(() => {
    const { user, isAdmin, loading } = authContextValue;
    if (loading) return; 

    const isUserAuthPage = pathname === '/login' || pathname === '/signup';
    const isAdminAuthPage = pathname === '/admin/login';
    const isAdminArea = pathname.startsWith('/admin/');

    if (user) {
      if (isAdmin) {
        // Correctly route logged-in admins
        if (isUserAuthPage || pathname === '/') {
          router.replace('/admin/analytics');
        }
      } else {
        // Correctly route logged-in regular users
        if (isAdminArea && !isAdminAuthPage) {
          router.replace('/profile'); 
        } 
        else if (isUserAuthPage || pathname === '/') {
          router.replace('/profile');
        }
      }
    }
  }, [authContextValue, pathname, router]);


  if (error) {
    return (
        <div className="flex flex-col gap-4 justify-center items-center h-screen bg-destructive text-destructive-foreground p-4 text-center">
            <AlertTriangle className="w-12 h-12" />
            <h1 className="text-2xl font-bold">Application Error</h1>
            <p>Could not initialize Firebase. The application cannot continue.</p>
            <p className="text-sm bg-black/20 p-2 rounded-md font-mono">{error}</p>
        </div>
    );
  }

  if (authContextValue.loading) {
     return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <Loader2 className="animate-spin text-primary h-12 w-12" />
        <p className="text-muted-foreground font-medium">Vidya EduCare is loading...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <DbContext.Provider value={services.db}>
        <AuthServiceContext.Provider value={services.auth}>
            {children}
        </AuthServiceContext.Provider>
      </DbContext.Provider>
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

export const useDb = (): Firestore | undefined => {
  return useContext(DbContext);
};

export const useAuthService = (): Auth | undefined => {
    return useContext(AuthServiceContext);
};
