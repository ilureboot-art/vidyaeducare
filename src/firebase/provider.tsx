
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import { Loader2, AlertTriangle } from 'lucide-react';
import { initializeFirebaseOnClient } from './client-init';
import type { Admin } from '@/lib/admin-data';
import { usePathname, useRouter } from 'next/navigation';

// Define the shape of our services and auth state
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

// Create contexts to hold the services and auth state
const AuthServiceContext = createContext<Auth | undefined>(undefined);
const DbContext = createContext<Firestore | undefined>(undefined);
const AuthContext = createContext<AuthState | undefined>(undefined);

// The main provider component
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

  // Effect to initialize Firebase when the provider mounts
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

  // Effect to listen for authentication state changes
  useEffect(() => {
    if (!services) return;

    const { auth, db } = services;
    setIsAuthLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      checkAdminStatus(user, db);
    });

    return () => unsubscribe();
  }, [services, checkAdminStatus]);

  // Memoize the context values to prevent unnecessary re-renders
  const authContextValue = useMemo(() => ({
    user: authState.user,
    isAdmin: authState.isAdmin,
    isHeadAdmin: authState.isHeadAdmin,
    loading: isAuthLoading || !services,
  }), [authState, isAuthLoading, services]);

  // Centralized redirection logic
   useEffect(() => {
    const { user, isAdmin, loading } = authContextValue;
    if (loading) return; // Wait for auth state to be fully resolved

    const isUserAuthPage = pathname === '/login' || pathname === '/signup';
    const isAdminAuthPage = pathname === '/admin/login';
    const isAdminArea = pathname.startsWith('/admin/');

    if (user) {
      // --- User is LOGGED IN ---
      if (isAdmin) {
        // User is an ADMIN
        // If admin is on any user-facing auth page or the admin login page, redirect to dashboard
        if (isUserAuthPage || isAdminAuthPage) {
          router.replace('/admin/analytics');
        }
      } else {
        // User is a REGULAR USER
        // If a regular user tries to access any admin page, send them to the user login (they might need to log out first)
        if (isAdminArea) {
          router.replace('/login'); 
        } 
        // If a regular user is on a user auth page, send them to their profile
        else if (isUserAuthPage) {
          router.replace('/profile');
        }
      }
    } else {
      // --- User is NOT LOGGED IN ---
      // If an unauthenticated user tries to access a protected admin page, send to admin login
      if (isAdminArea && !isAdminAuthPage) {
        router.replace('/admin/login');
      }
      // Note: Regular protected pages are handled by the <ProtectedRoute> component itself,
      // which will redirect to /login if there's no user.
    }
  }, [authContextValue, pathname, router]);


  // Render error state
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

  // Render loading state while services initialize or auth is checked
  if (authContextValue.loading) {
     return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="ml-2">Connecting to services...</p>
      </div>
    );
  }

  // Render the provider tree with the application
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

// Custom hooks to access the contexts
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
