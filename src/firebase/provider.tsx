
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { onAuthStateChanged, type Auth, type User, signOut } from 'firebase/auth';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import { Loader2, AlertTriangle, Shield } from 'lucide-react';
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

// Persistent role cache for the session
let sessionRoleCache: { uid: string; isAdmin: boolean; isHeadAdmin: boolean } | null = null;

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [services] = useState(() => {
    try {
      return getFirebaseServices();
    } catch (e) {
      return null;
    }
  });

  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAdmin: false,
    isHeadAdmin: false,
  });

  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const lastPathRef = useRef<string>("");
  const isRedirectingRef = useRef(false);

  const resolveUserRole = useCallback(async (user: User | null, db: Firestore) => {
    if (!user) {
      sessionRoleCache = null;
      return { isAdmin: false, isHeadAdmin: false };
    }

    if (sessionRoleCache && sessionRoleCache.uid === user.uid) {
      return { isAdmin: sessionRoleCache.isAdmin, isHeadAdmin: sessionRoleCache.isHeadAdmin };
    }

    try {
      const adminDocRef = doc(db, "admins", user.uid);
      const adminDocSnap = await getDoc(adminDocRef);
      const adminData = adminDocSnap.exists() ? adminDocSnap.data() as Admin : null;
      
      const isAdmin = !!adminData && (adminData.status === 'Active' || adminData.role === 'Head Admin');
      const isHeadAdmin = isAdmin && adminData.role === 'Head Admin';
      
      sessionRoleCache = { uid: user.uid, isAdmin, isHeadAdmin };
      return { isAdmin, isHeadAdmin };
    } catch (e) {
      console.error("Role resolution error:", e);
      return { isAdmin: false, isHeadAdmin: false };
    }
  }, []);

  useEffect(() => {
    if (!services) {
        setError("Firebase failed to initialize. Check environment variables.");
        return;
    }

    const { auth, db } = services;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const roles = await resolveUserRole(user, db);
      setAuthState({
        user,
        isAdmin: roles.isAdmin,
        isHeadAdmin: roles.isHeadAdmin,
        loading: false,
      });
    });

    return () => unsubscribe();
  }, [services, resolveUserRole]);

  // The Centralized "Sorting Hat" Routing Engine
  useEffect(() => {
    if (authState.loading || isRedirectingRef.current) return;

    const { user, isAdmin } = authState;
    const isAdminArea = pathname.startsWith('/admin');
    const isAuthPage = ['/login', '/signup', '/admin/login', '/forgot-password', '/admin/setup'].includes(pathname);
    const isPublicPage = pathname === '/' || pathname === '/how-to-play';

    let targetPath: string | null = null;

    if (user) {
      if (isAdmin) {
        // Admins are forced to the Admin Portal
        if (!isAdminArea || isAuthPage) {
          targetPath = '/admin/analytics';
        }
      } else {
        // Students are barred from Admin areas and Auth pages
        if (isAdminArea || isAuthPage) {
          targetPath = '/profile';
        }
      }
    } else {
      // Unauthenticated users are sent to Home if they try to access private routes
      const privateRoutes = ['/profile', '/wallet', '/store', '/transactions', '/refer', '/iba', '/leaderboard', '/settings', '/quiz-clash', '/mock-test'];
      const isPrivate = privateRoutes.some(route => pathname === route || pathname.startsWith(route + '/')) || (isAdminArea && pathname !== '/admin/login');
      
      if (isPrivate) {
        targetPath = '/';
      }
    }

    if (targetPath && targetPath !== pathname && targetPath !== lastPathRef.current) {
      isRedirectingRef.current = true;
      lastPathRef.current = targetPath;
      router.replace(targetPath);
      // Reset redirection flag after a short delay to allow Next.js to complete the move
      setTimeout(() => { isRedirectingRef.current = false; }, 500);
    }
  }, [authState, pathname, router]);

  const authContextValue = useMemo(() => authState, [authState]);

  if (error) {
    return (
        <div className="flex flex-col gap-4 justify-center items-center h-screen bg-destructive text-destructive-foreground p-4 text-center">
            <AlertTriangle className="w-12 h-12" />
            <h1 className="text-2xl font-bold">System Configuration Error</h1>
            <p className="text-sm bg-black/20 p-2 rounded-md font-mono">{error}</p>
        </div>
    );
  }

  if (authState.loading) {
     return (
      <div className="flex flex-col items-center justify-center h-screen space-y-6 bg-background text-center p-4">
        <div className="relative">
            <Shield className="w-16 h-16 text-primary animate-pulse" />
            <Loader2 className="absolute inset-0 w-16 h-16 text-primary/30 animate-spin" />
        </div>
        <div className="space-y-2">
            <p className="text-xl font-black text-primary tracking-tighter uppercase">Vidya EduCare</p>
            <p className="text-muted-foreground text-sm font-medium tracking-wide">Establishing secure connection...</p>
        </div>
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
