
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { onAuthStateChanged, type Auth, type User, signOut } from 'firebase/auth';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import { Loader2, Shield } from 'lucide-react';
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

// Session-level cache to prevent flicker and redundant DB hits
let sessionRoleCache: { uid: string; isAdmin: boolean; isHeadAdmin: boolean } | null = null;

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [services] = useState(() => {
    try {
      return getFirebaseServices();
    } catch (e) {
      console.error("Firebase Services failed to initialize:", e);
      return null;
    }
  });

  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAdmin: false,
    isHeadAdmin: false,
  });

  const router = useRouter();
  const pathname = usePathname();
  const routingInProgress = useRef(false);

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
      
      if (adminDocSnap.exists()) {
        const adminData = adminDocSnap.data() as Admin;
        const isAdmin = adminData.status === 'Active' || adminData.role === 'Head Admin';
        const isHeadAdmin = adminData.role === 'Head Admin';
        
        sessionRoleCache = { uid: user.uid, isAdmin, isHeadAdmin };
        return { isAdmin, isHeadAdmin };
      }
    } catch (e) {
      console.error("Critical: Role resolution failed.", e);
    }

    sessionRoleCache = { uid: user.uid, isAdmin: false, isHeadAdmin: false };
    return { isAdmin: false, isHeadAdmin: false };
  }, []);

  useEffect(() => {
    if (!services) return;

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

  // Unified Global Routing Engine
  useEffect(() => {
    if (authState.loading || routingInProgress.current) return;

    const { user, isAdmin } = authState;
    const isAdminArea = pathname.startsWith('/admin');
    const isAuthPage = ['/login', '/signup', '/admin/login', '/forgot-password'].includes(pathname);
    const isProtectedStudentPage = ['/profile', '/wallet', '/store', '/transactions', '/iba', '/quiz-clash', '/mock-test', '/settings', '/leaderboard'].some(p => pathname.startsWith(p));
    
    let targetPath: string | null = null;

    if (user) {
      if (isAdmin) {
        // Admins go to Dashboard if they try to access student area or login pages
        // They are allowed to stay on the public Home page (/)
        if (isAuthPage || isProtectedStudentPage) {
          targetPath = '/admin/analytics';
        }
      } else {
        // Students are barred from Admin areas and Auth pages
        if (isAdminArea || isAuthPage) {
          targetPath = '/profile';
        }
      }
    } else {
      // Unauthenticated users are sent to Home from any private area
      const isPrivate = (isAdminArea && pathname !== '/admin/login') || isProtectedStudentPage;
      if (isPrivate) {
        targetPath = '/';
      }
    }

    if (targetPath && targetPath !== pathname) {
      routingInProgress.current = true;
      router.replace(targetPath);
      // Reset ref after a short delay to allow the new pathname to register
      setTimeout(() => { routingInProgress.current = false; }, 500);
    }
  }, [authState, pathname, router]);

  const authContextValue = useMemo(() => authState, [authState]);

  if (authState.loading) {
     return (
      <div className="flex flex-col items-center justify-center h-screen space-y-6 bg-background text-center p-4">
        <div className="relative">
            <Shield className="w-16 h-16 text-primary animate-pulse" />
            <Loader2 className="absolute inset-0 w-16 h-16 text-primary/30 animate-spin" />
        </div>
        <div className="space-y-2">
            <p className="text-xl font-black text-primary tracking-tighter uppercase">Vidya EduCare</p>
            <p className="text-muted-foreground text-sm font-medium tracking-wide">Securing Administrative Workspace...</p>
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
