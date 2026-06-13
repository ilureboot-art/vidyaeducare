
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import { doc, getDoc, type Firestore, type DocumentSnapshot } from 'firebase/firestore';
import { Loader2, Shield } from 'lucide-react';
import { getFirebaseServices } from './client-init';
import type { Admin } from '@/lib/admin-data';
import { usePathname, useRouter } from 'next/navigation';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { TransactionStatusObserver } from '@/components/TransactionStatusObserver';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isHeadAdmin: boolean;
  isResolved: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);
const DbContext = createContext<Firestore | undefined>(undefined);
const AuthServiceContext = createContext<Auth | undefined>(undefined);

const ROLE_CACHE_KEY = 'vidya_auth_role_v20_ultra';
const MASTER_ADMIN_EMAIL = 'admin@vidyaeducare.com';

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

  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAdmin: false,
    isHeadAdmin: false,
    isResolved: false,
  });

  const router = useRouter();
  const pathname = usePathname() || "";
  const navigationLock = useRef<string | null>(null);

  const processSnap = useCallback((snap: DocumentSnapshot | null, user: User) => {
      let roles = { isAdmin: false, isHeadAdmin: false };
      
      if (user.email?.toLowerCase() === MASTER_ADMIN_EMAIL) {
          roles = { isAdmin: true, isHeadAdmin: true };
      } else if (snap && snap.exists()) {
        const adminData = snap.data() as Admin;
        roles = {
            isAdmin: adminData.status === 'Active' || adminData.role === 'Head Admin',
            isHeadAdmin: adminData.role === 'Head Admin'
        };
      }
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({ ...roles, uid: user.uid }));
      }
      return roles;
  }, []);

  const resolveUserRole = useCallback(async (user: User | null, db: Firestore) => {
    if (!user) {
      if (typeof window !== 'undefined') sessionStorage.removeItem(ROLE_CACHE_KEY);
      return { isAdmin: false, isHeadAdmin: false };
    }

    if (user.email?.toLowerCase() === MASTER_ADMIN_EMAIL) {
        const roles = { isAdmin: true, isHeadAdmin: true };
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({ ...roles, uid: user.uid }));
        }
        return roles;
    }

    const cached = getCachedRoles();
    if (cached && cached.uid === user.uid) {
        return { isAdmin: cached.isAdmin, isHeadAdmin: cached.isHeadAdmin };
    }

    try {
      const adminDocRef = doc(db, "admins", user.uid);
      const adminDocSnap = await getDoc(adminDocRef);
      return processSnap(adminDocSnap, user);
    } catch (e) {
      console.warn("Role resolution default applied.");
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
          if (typeof window !== 'undefined') sessionStorage.removeItem(ROLE_CACHE_KEY);
          setAuthState({ user: null, loading: false, isAdmin: false, isHeadAdmin: false, isResolved: true });
          return;
      }

      const cached = getCachedRoles();
      if (cached && cached.uid === user.uid) {
          setAuthState({ user, loading: false, isAdmin: cached.isAdmin, isHeadAdmin: cached.isHeadAdmin, isResolved: true });
          return;
      }

      setAuthState(prev => ({ ...prev, user, loading: false, isResolved: false }));

      try {
          const roles = await resolveUserRole(user, db);
          setAuthState({ user, loading: false, ...roles, isResolved: true });
      } catch (e) {
          setAuthState({ user, loading: false, isAdmin: false, isHeadAdmin: false, isResolved: true });
      }
    });

    return () => unsubscribe();
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
        if (isAuthRoute || cleanPath === '/' || (!isAdminArea && !isPublicRoute)) {
          targetPath = '/admin/analytics';
        }
      } else {
        if (isAdminArea || isAuthRoute || cleanPath === '/') {
          if (!isPublicRoute) targetPath = '/profile';
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
      const timer = setTimeout(() => { navigationLock.current = null; }, 1000);
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
            <p className="text-muted-foreground text-sm font-medium tracking-wide">Syncing Role Access...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authState}>
      <DbContext.Provider value={services?.db}>
        <AuthServiceContext.Provider value={services?.auth}>
            <FirebaseErrorListener />
            <TransactionStatusObserver />
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
