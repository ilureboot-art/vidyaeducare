
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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

const getCachedRoles = () => {
    if (typeof window === 'undefined') return null;
    try {
        const cached = sessionStorage.getItem('ve_role');
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
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
      sessionStorage.removeItem('ve_role');
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
      
      sessionStorage.setItem('ve_role', JSON.stringify(roles));
      return roles;
    } catch (e) {
      console.error("Role resolution failed:", e);
      return { isAdmin: false, isHeadAdmin: false };
    }
  }, []);

  useEffect(() => {
    if (!services) return;

    // Safety timeout to prevent indefinite loading hang
    const safetyTimer = setTimeout(() => {
        setAuthState(prev => ({ ...prev, loading: false }));
    }, 5000);

    const { auth, db } = services;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
          sessionStorage.removeItem('ve_role');
          setAuthState({ user: null, loading: false, isAdmin: false, isHeadAdmin: false });
          return;
      }

      const cached = getCachedRoles();
      if (cached) {
          setAuthState({ user, loading: false, ...cached });
          // Sync background refresh
          resolveUserRole(user, db).then(fresh => {
              if (JSON.stringify(fresh) !== JSON.stringify(cached)) {
                  setAuthState(prev => ({ ...prev, ...fresh }));
              }
          });
      } else {
          const roles = await resolveUserRole(user, db);
          setAuthState({ user, loading: false, ...roles });
      }
    });

    return () => {
        unsubscribe();
        clearTimeout(safetyTimer);
    };
  }, [services, resolveUserRole]);

  // Unified Redirection Engine with Mutex Lock
  useEffect(() => {
    if (authState.loading) return;

    const { user, isAdmin } = authState;
    const isAdminArea = pathname.startsWith('/admin');
    const isAuthRoute = ['/login', '/signup', '/admin/login', '/forgot-password', '/admin/setup'].includes(pathname);
    const isPublicRoute = ['/how-to-play'].includes(pathname);
    
    let targetPath: string | null = null;

    if (user) {
      if (isAdmin) {
        // ADMINS: Forcefully locked into the Dashboard workspace.
        // They are strictly barred from the public home page while logged in
        // to prevent the "automatic logout" sensation.
        if (!isAdminArea) {
          targetPath = '/admin/analytics';
        }
      } else {
        // STUDENTS: Barred from Admin Panel and redirected from Auth/Home to Profile.
        if (isAdminArea || isAuthRoute || pathname === '/') {
          targetPath = '/profile';
        }
      }
    } else {
      // GUESTS: Barred from secure areas.
      if (isAdminArea || (!isAuthRoute && !isPublicRoute && pathname !== '/')) {
        targetPath = '/';
      }
    }

    // Apply Navigation Mutex to prevent "Scrolling" reload loops
    if (targetPath && targetPath !== pathname && navigationLock.current !== targetPath) {
      navigationLock.current = targetPath;
      router.replace(targetPath);
      
      // Release lock after navigation is likely processed
      const timer = setTimeout(() => { navigationLock.current = null; }, 1000);
      return () => clearTimeout(timer);
    }
  }, [authState, pathname, router]);

  if (authState.loading) {
     return (
      <div className="flex flex-col items-center justify-center h-screen space-y-6 bg-background text-center p-4">
        <div className="relative">
            <Shield className="w-16 h-16 text-primary animate-pulse" />
            <Loader2 className="absolute inset-0 w-16 h-16 text-primary/30 animate-spin" />
        </div>
        <div className="space-y-2">
            <p className="text-xl font-black text-primary tracking-tighter uppercase italic">Vidya EduCare</p>
            <p className="text-muted-foreground text-sm font-medium tracking-wide">Syncing Workspace Credentials...</p>
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
