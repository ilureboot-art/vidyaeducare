
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/forgot-password');
      const isAdminLoginPage = pathname.startsWith('/admin/login');
      
      if (user && (isAuthPage || pathname === '/')) {
          // If user is logged in and on an auth page or the landing page, redirect to profile
          router.push('/profile');
      } else if (!user && !isAuthPage && !isAdminLoginPage && pathname !== '/' && pathname !== '/how-to-play') {
          // If user is not logged in and not on a public page, redirect to login
          router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const value = { user, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
