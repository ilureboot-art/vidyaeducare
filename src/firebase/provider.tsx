"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import { doc, getDoc, type Firestore, type DocumentSnapshot } from 'firebase/firestore';
import { Loader2, Shield } from 'lucide-react';
import { getFirebaseServices } from './client-init';
import type { Admin } from '@/lib/admin-data';
import { usePathname, useRouter } from 'next/navigation';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isHeadAdmin: boolean;
  isResolved: boolean; // Tracks if role check is complete for the current user
}

const AuthContext = createContext<AuthState | undefined>(undefined);
const DbContext = createContext<Firestore | undefined>(undefined);
const AuthServiceContext = createContext<Auth | undefined>(undefined);

// Synchronous role cache to prevent hydration mismatches and sequential load lag
const ROLE_CACHE_KEY = 'vidya_auth_role_v14_stable';

const getCachedRoles = () => {
    if (typeof window === 'undefined') return null;
    try {
        const cached = sessionStorage.getItem(ROLE_CACHE_KEY);
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
};

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const services = useMemo(() => {
    try {
      return getFirebaseServices();
    } catch (e) {
      console.error("Firebase Services failed to initialize:", e);
      return null;
    }
  }, []);

  const [authState, setAuthState] = useState<AuthState>(() => {
      const cached = getCachedRoles();
      return {
        user: null,
        loading: true,
        isAdmin: cached?.isAdmin || false,
        isHeadAdmin: cached?.isHeadAdmin || false,
        isResolved: false,
      };
  });

  const router = useRouter();
  const pathname = usePathname();
  const navigationLock = useRef<string | null>(null);

  const processSnap = useCallback((snap: DocumentSnapshot | null, uid: string) => {
      let roles = { isAdmin: false, isHeadAdmin: false };
      
      if (snap && snap.exists()) {
        const adminData = snap.data() as Admin;
        roles = {
            isAdmin: adminData.status === 'Active' || adminData.role === 'Head Admin',
            isHeadAdmin: adminData.role === 'Head Admin'
        };
      }
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({ ...roles, uid }));
      }
      return roles;
  }, []);

  const resolveUserRole = useCallback(async (user: User | null, db: Firestore) => {
    if (!user) {
      sessionStorage.removeItem(ROLE_CACHE_KEY);
      return { isAdmin: false, isHeadAdmin: false };
    }

    const cached = getCachedRoles();
    if (cached && cached.uid === user.uid) {
        return { isAdmin: cached.isAdmin, isHeadAdmin: cached.isHeadAdmin };
    }

    // Replication lag check: only wait if the account was created in the last 30 seconds
    const creationTime = new Date(user.metadata.creationTime || 0).getTime();
    const isNewAccount = (Date.now() - creationTime) < 30000;

    try {
      const adminDocRef = doc(db, "admins", user.uid);
      
      // Hardened getDoc with localized catch to prevent Unhandled Runtime Error during offline states
      const adminDocSnap = await getDoc(adminDocRef).catch((e: any) => {
          const isOffline = e.message?.toLowerCase().includes('offline') || e.code === 'unavailable' || e.code === 'permission-denied';
          if (isOffline) {
              console.warn("Firestore role resolution suppressed (Offline/Perms). Defaulting to student.");
          } else {
              console.error("Firestore role resolution failed:", e.message);
          }
          return null; 
      });
      
      if (!adminDocSnap?.exists() && isNewAccount && typeof window !== 'undefined' && window.navigator.onLine) {
          // Replication lag buffer: only retry for brand new accounts
          await new Promise(r => setTimeout(r, 1500));
          const retrySnap = await getDoc(adminDocRef).catch(() => null);
          return processSnap(retrySnap, user.uid);
      }
      
      return processSnap(adminDocSnap, user.uid);
    } catch (e) {
      console.error("Critical role resolution failure:", e);
      return { isAdmin: false, isHeadAdmin: false };
    }
  }, [processSnap]);

  useEffect(() => {
    if (!services) {
        setAuthState(prev => ({ ...prev, loading: false, isResolved: true }));
        return;
    }

    const { auth, db } = services;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
          sessionStorage.removeItem(ROLE_CACHE_KEY);
          setAuthState({ user: null, loading: false, isAdmin: false, isHeadAdmin: false, isResolved: true });
          return;
      }

      // Ensure state is cleared before starting resolution to trigger "Verifying..." UI
      setAuthState(prev => ({ ...prev, user, loading: false, isResolved: false }));

      // Resolve roles definitively
      const roles = await resolveUserRole(user, db);
      setAuthState({ user, loading: false, ...roles, isResolved: true });
    });

    const timeout = setTimeout(() => {
        setAuthState(prev => ({ ...prev, loading: false, isResolved: true }));
    }, 15000);

    return () => {
        unsubscribe();
        clearTimeout(timeout);
    };
  }, [services, resolveUserRole]);

  useEffect(() => {
    if (authState.loading || !authState.isResolved || !services) return;

    const { user, isAdmin } = authState;
    const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
    
    const isPublicRoute = ['/', '/how-to-play', '/admin/setup', '/check-head-admin', '/forgot-password', '/ai-tutor', '/ai-notes', '/trial-mock-test'].includes(cleanPath);
    const isAuthRoute = ['/login', '/signup', '/admin/login'].includes(cleanPath);
    const isAdminArea = cleanPath.startsWith('/admin');
    
    let targetPath: string | null = null;

    if (user) {
      if (isAdmin) {
        const onRestrictedGuestPage = !isAdminArea && !isPublicRoute;
        const onSetupPath = cleanPath === '/admin/setup' || cleanPath === '/check-head-admin';

        if ((onRestrictedGuestPage || isAuthRoute || cleanPath === '/') && !onSetupPath) {
          targetPath = '/admin/analytics';
        }
      } else {
        const inRestrictedAdminZone = isAdminArea && !isPublicRoute;
        // If logged in student is on a restricted admin page, login/signup, or home, send to profile
        if (inRestrictedAdminZone || isAuthRoute || cleanPath === '/') {
          targetPath = '/profile';
        }
      }
    } else {
      if (!isPublicRoute && !isAuthRoute) {
        targetPath = '/';
      }
    }

    if (targetPath && targetPath !== cleanPath && navigationLock.current !== targetPath) {
      navigationLock.current = targetPath;
      router.replace(targetPath);
      const timer = setTimeout(() => { navigationLock.current = null; }, 1500);
      return () => clearTimeout(timer);
    }
  }, [authState, pathname, router, services]);

  if (authState.loading || (!authState.isResolved && authState.user)) {
     return (
      <div className="flex flex-col items-center justify-center h-screen space-y-6 bg-background text-center p-4">
        <div className="relative">
            <Shield className="w-16 h-16 text-primary animate-pulse" />
            <Loader2 className="absolute inset-0 w-16 h-16 text-primary/30 animate-spin" />
        </div>
        <div className="space-y-2">
            <p className="text-xl font-black text-primary tracking-tighter uppercase italic">Vidya EduCare</p>
            <p className="text-muted-foreground text-sm font-medium tracking-wide">Synchronizing Session...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authState}>
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
