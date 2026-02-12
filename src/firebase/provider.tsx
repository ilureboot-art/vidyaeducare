
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import { Loader2, AlertTriangle } from 'lucide-react';
import { getFirebaseServices } from './client-init';
import type { Admin } from '@/lib/admin-data';
import { usePathname, useRouter } from 'next/navigation';

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
  // Initialize services once at the top level
  const [services] = useState(() => {
    try {
      return getFirebaseServices();
    } catch (e) {
      return null;
    }
  });

  const [authState, setAuthState] = useState<Omit<AuthState, 'loading'>>({
    user: null,
    isAdmin: false,
    isHeadAdmin: false,
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();

  const checkAdminStatus = useCallback(async (user: User | null, db: Firestore) => {
    if (!user) {
      setAuthState({ user: null, isAdmin: false, isHeadAdmin: false });
      setIsAuthLoading(false);
      return;
    }

    try {
      const adminDocRef = doc(db, "admins", user.uid);
      const adminDocSnap = await getDoc(adminDocRef);
      const adminData = adminDocSnap.exists() ? adminDocSnap.data() as Admin : null;
      
      const isAdmin = !!adminData && (adminData.status === 'Active' || adminData.role === 'Head Admin');
      const isHeadAdmin = isAdmin && adminData.role === 'Head Admin';
      
      setAuthState({ user, isAdmin, isHeadAdmin });
    } catch (e) {
      console.error("Error checking admin status:", e);
      setAuthState({ user, isAdmin: false, isHeadAdmin: false });
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!services) {
        setError("Firebase services failed to initialize.");
        return;
    }

    const { auth, db } = services;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthLoading(true);
      checkAdminStatus(user, db);
    });

    return () => unsubscribe();
  }, [services, checkAdminStatus]);

  const authContextValue = useMemo(() => ({
    user: authState.user,
    isAdmin: authState.isAdmin,
    isHeadAdmin: authState.isHeadAdmin,
    loading: isAuthLoading,
  }), [authState, isAuthLoading]);

  // Centralized Global Routing with strict role separation
  useEffect(() => {
    const { user, isAdmin, loading } = authContextValue;
    if (loading) return; 

    const isAdminArea = pathname.startsWith('/admin');
    const isAuthPage = ['/login', '/signup', '/admin/login', '/forgot-password'].includes(pathname);

    if (user) {
      if (isAdmin) {
        // ADMINS: Must stay in /admin area
        if (!isAdminArea || isAuthPage) {
          router.replace('/admin/analytics');
        }
      } else {
        // PLAYERS: Must stay in user area
        if (isAdminArea || isAuthPage) {
          router.replace('/profile');
        }
      }
    } else {
        // GUESTS: Protect private routes
        const privateUserRoutes = ['/profile', '/wallet', '/store', '/transactions', '/refer', '/iba/dashboard', '/quiz-clash', '/leaderboard', '/settings'];
        const isPrivateRoute = privateUserRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
        
        if (isAdminArea && pathname !== '/admin/login') {
            router.replace('/admin/login');
        } else if (isPrivateRoute) {
            router.replace('/login');
        }
    }
  }, [authContextValue, pathname, router]);

  if (error) {
    return (
        <div className="flex flex-col gap-4 justify-center items-center h-screen bg-destructive text-destructive-foreground p-4 text-center">
            <AlertTriangle className="w-12 h-12" />
            <h1 className="text-2xl font-bold">Application Error</h1>
            <p className="text-sm bg-black/20 p-2 rounded-md font-mono">{error}</p>
        </div>
    );
  }

  if (authContextValue.loading) {
     return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <Loader2 className="animate-spin text-primary h-12 w-12" />
        <p className="text-muted-foreground font-medium italic tracking-wide">Syncing session...</p>
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
  if (context === undefined) throw new Error('useAuth must be used within a FirebaseProvider');
  return context;
};

export const useDb = (): Firestore | undefined => useContext(DbContext);
export const useAuthService = (): Auth | undefined => useContext(AuthServiceContext);
