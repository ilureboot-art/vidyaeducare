"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
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

const AuthServiceContext = createContext<Auth | undefined>(undefined);
const DbContext = createContext<Firestore | undefined>(undefined);
const AuthContext = createContext<AuthState | undefined>(undefined);

// HIGH-PERFORMANCE CACHING UTILS
const getCachedRole = (uid: string) => {
    if (typeof window === 'undefined') return null;
    const cached = sessionStorage.getItem(`ve_role_${uid}`);
    return cached ? JSON.parse(cached) : null;
};

const setCachedRole = (uid: string, roles: { isAdmin: boolean; isHeadAdmin: boolean }) => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(`ve_role_${uid}`, JSON.stringify(roles));
};

const clearRoleCache = () => {
    if (typeof window === 'undefined') return;
    Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('ve_role_')) sessionStorage.removeItem(key);
    });
};

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [services] = useState(() => {
    try {
      return getFirebaseServices();
    } catch (e) {
      console.error("Firebase Services failed to initialize:", e);
      return null;
    }
  });

  const [authState, setAuthState] = useState<AuthState>(() => {
      return {
        user: null,
        loading: true,
        isAdmin: false,
        isHeadAdmin: false,
      };
  });

  const router = useRouter();
  const pathname = usePathname();
  const isRedirecting = useRef(false);

  const resolveUserRole = useCallback(async (user: User | null, db: Firestore) => {
    if (!user) {
      clearRoleCache();
      return { isAdmin: false, isHeadAdmin: false };
    }

    const cached = getCachedRole(user.uid);
    if (cached) return cached;

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
      
      setCachedRole(user.uid, roles);
      return roles;
    } catch (e) {
      console.error("Role resolution failed:", e);
      return { isAdmin: false, isHeadAdmin: false };
    }
  }, []);

  useEffect(() => {
    if (!services) return;

    const { auth, db } = services;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
          setAuthState({ user: null, loading: false, isAdmin: false, isHeadAdmin: false });
          return;
      }

      const cached = getCachedRole(user.uid);
      if (cached) {
          setAuthState({ user, loading: false, ...cached });
          resolveUserRole(user, db).then(freshRoles => {
              if (JSON.stringify(freshRoles) !== JSON.stringify(cached)) {
                  setAuthState(prev => ({ ...prev, ...freshRoles }));
              }
          });
      } else {
          const roles = await resolveUserRole(user, db);
          setAuthState({ user, loading: false, ...roles });
      }
    });

    return () => unsubscribe();
  }, [services, resolveUserRole]);

  // DETERMINISTIC ROUTING ENGINE (Synchronized)
  useEffect(() => {
    if (authState.loading || isRedirecting.current) return;

    const { user, isAdmin } = authState;
    const isAdminArea = pathname.startsWith('/admin');
    const isAuthRoute = ['/login', '/signup', '/admin/login', '/forgot-password', '/admin/setup'].includes(pathname);
    const isPublicRoute = ['/', '/how-to-play'].includes(pathname);
    
    let targetPath: string | null = null;

    if (user) {
      if (isAdmin) {
        // ADMINS: Forcefully stay in Admin Dashboard if trying to access student pages or home
        if (isAuthRoute || (!isAdminArea && !isPublicRoute) || pathname === '/') {
          targetPath = '/admin/analytics';
        }
      } else {
        // STUDENTS: Barred from admin panel and auth pages
        if (isAdminArea || isAuthRoute) {
          targetPath = '/profile';
        }
      }
    } else {
      // UNAUTHENTICATED: Only allowed on public/auth routes
      if (!isPublicRoute && !isAuthRoute) {
        targetPath = '/';
      }
    }

    if (targetPath && targetPath !== pathname) {
      isRedirecting.current = true;
      router.replace(targetPath);
      setTimeout(() => { isRedirecting.current = false; }, 800);
    }
  }, [authState, pathname, router]);

  const authContextValue = useMemo(() => authState, [authState]);

  // Prevent shell leakage during transition
  const isAdminArea = pathname.startsWith('/admin');
  const roleMismatch = authState.user && (
    (authState.isAdmin && !isAdminArea && pathname !== '/' && pathname !== '/how-to-play') ||
    (!authState.isAdmin && isAdminArea)
  );

  if (authState.loading || roleMismatch || isRedirecting.current) {
     return (
      <div className="flex flex-col items-center justify-center h-screen space-y-6 bg-background text-center p-4">
        <div className="relative">
            <Shield className="w-16 h-16 text-primary animate-pulse" />
            <Loader2 className="absolute inset-0 w-16 h-16 text-primary/30 animate-spin" />
        </div>
        <div className="space-y-2">
            <p className="text-xl font-black text-primary tracking-tighter uppercase">Vidya EduCare</p>
            <p className="text-muted-foreground text-sm font-medium tracking-wide">
                {roleMismatch ? "Securing Workspace Boundaries..." : "Verifying Administrative Permissions..."}
            </p>
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
