
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
        const adminData = adminDocSnap.exists() ? adminDocSnap.data() as Admin : null;
        
        const isAdmin = !!adminData && adminData.status === 'Active';
        const isHeadAdmin = isAdmin && adminData.role === 'Head Admin';
        
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
      // When auth state changes, we mark as loading until the role check is done
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

  // Unified, Centralized Redirection Logic
  useEffect(() => {
    const { user, isAdmin, loading } = authContextValue;
    if (loading) return; 

    const isUserAuthPage = pathname === '/login' || pathname === '/signup';
    const isAdminAuthPage = pathname === '/admin/login';
    const isRoot = pathname === '/';
    const isAnyAuthPage = isUserAuthPage || isAdminAuthPage || isRoot;
    const isAdminArea = pathname.startsWith('/admin/') && !isAdminAuthPage;

    if (user) {
      if (isAdmin) {
        // Logged in as Admin: Redirect away from ANY login/auth page or the landing page
        if (isAnyAuthPage) {
          router.replace('/admin/analytics');
        }
      } else {
        // Logged in as Regular User: 
        // 1. Redirect away from admin areas
        if (isAdminArea) {
          router.replace('/profile');
        }
        // 2. Redirect away from any login/auth page or landing page
        else if (isAnyAuthPage) {
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
        <p className="text-muted-foreground font-medium italic tracking-wide">Vidya EduCare is checking your credentials...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <DbContext.Provider value={services?.db}>
        <AuthServiceContext.Provider value={services?.auth}>
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
