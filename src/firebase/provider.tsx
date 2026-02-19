
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { onAuthStateChanged, type Auth, type User } from 'firebase/auth';
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

const AuthContext = createContext<AuthState | undefined>(undefined);
const DbContext = createContext<Firestore | undefined>(undefined);
const AuthServiceContext = createContext<Auth | undefined>(undefined);

const ROLE_CACHE_KEY = 've_role_v3';

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
      };
  });

  const router = useRouter();
  const pathname = usePathname();
  const navigationLock = useRef<string | null>(null);

  const resolveUserRole = useCallback(async (user: User | null, db: Firestore) => {
    if (!user) {
      sessionStorage.removeItem(ROLE_CACHE_KEY);
      return { isAdmin: false, isHeadAdmin: false };
    }

    try {
      const adminDocRef = doc(db, "admins", user.uid);
      const adminDocSnap = await getDoc(adminDocRef);
      
      let roles = { isAdmin: false, isHeadAdmin: false };
      
      if (adminDocSnap.exists()) {
        const adminData = adminDocSnap.data() as Admin;
        roles = {
            isAdmin: adminData.status === 'Active' || adminData.role === 'Head Admin',
            isHeadAdmin: adminData.role === 'Head Admin'
        };
      }
      
      sessionStorage.setItem(ROLE_CACHE_KEY, JSON.stringify(roles));
      return roles;
    } catch (e) {
      console.error("Role resolution failed:", e);
      return getCachedRoles() || { isAdmin: false, isHeadAdmin: false };
    }
  }, []);

  useEffect(() => {
    if (!services) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return;
    }

    const { auth, db } = services;
    
    // Safety timer to prevent infinite loading screen on network failure
    const safetyTimeout = setTimeout(() => {
        setAuthState(prev => ({ ...prev, loading: false }));
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
          sessionStorage.removeItem(ROLE_CACHE_KEY);
          setAuthState({ user: null, loading: false, isAdmin: false, isHeadAdmin: false });
          return;
      }

      // Crucial: Wait for role before allowing navigation to settle
      const roles = await resolveUserRole(user, db);
      setAuthState({ user, loading: false, ...roles });
    });

    return () => {
        unsubscribe();
        clearTimeout(safetyTimeout);
    };
  }, [services, resolveUserRole]);

  useEffect(() => {
    if (authState.loading || !services) return;

    const { user, isAdmin } = authState;
    const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
    
    const isAdminArea = cleanPath.startsWith('/admin');
    const isAuthRoute = ['/login', '/signup', '/admin/login', '/forgot-password', '/admin/setup'].includes(cleanPath);
    const isPublicRoute = ['/how-to-play', '/', '/check-head-admin'].includes(cleanPath);
    
    let targetPath: string | null = null;

    if (user) {
      if (isAdmin) {
        // Force Admins into Dashboard
        if (!isAdminArea) {
          targetPath = '/admin/analytics';
        }
      } else {
        // Force Students into Player Workspace
        if (isAdminArea || isAuthRoute || cleanPath === '/') {
          targetPath = '/profile';
        }
      }
    } else {
      // Guests belong in auth/public routes
      if (isAdminArea || (!isAuthRoute && !isPublicRoute)) {
        targetPath = '/';
      }
    }

    if (targetPath && targetPath !== cleanPath && navigationLock.current !== targetPath) {
      navigationLock.current = targetPath;
      router.replace(targetPath);
      
      const timer = setTimeout(() => { navigationLock.current = null; }, 2000);
      return () => clearTimeout(timer);
    }
  }, [authState, pathname, router, services]);

  if (authState.loading) {
     return (
      <div className="flex flex-col items-center justify-center h-screen space-y-6 bg-background text-center p-4">
        <div className="relative">
            <Shield className="w-16 h-16 text-primary animate-pulse" />
            <Loader2 className="absolute inset-0 w-16 h-16 text-primary/30 animate-spin" />
        </div>
        <div className="space-y-2">
            <p className="text-xl font-black text-primary tracking-tighter uppercase italic">Vidya EduCare</p>
            <p className="text-muted-foreground text-sm font-medium tracking-wide">Establishing Secure Session...</p>
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
