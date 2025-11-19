
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useFirebase } from '@/context/FirebaseClientProvider';
import { onAuthStateChanged, User, type Auth } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth, loading: firebaseLoading } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Firebase is still loading, the auth state is also loading.
    if (firebaseLoading) {
      setLoading(true);
      return;
    }

    // If there's no auth service, we're not loading auth state.
    if (!auth) {
      setLoading(false);
      return;
    }

    // Firebase is ready, so set up the auth state listener.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth, firebaseLoading]);

  const value = { user, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
