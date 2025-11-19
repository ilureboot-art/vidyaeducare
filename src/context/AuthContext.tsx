"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getFirebase } from '@/lib/firebase';
import { onAuthStateChanged, User, type Auth } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<Auth | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const { auth: firebaseAuth } = await getFirebase();
      setAuth(firebaseAuth);
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (auth) {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setUser(user);
          setLoading(false);
        });

        return () => unsubscribe();
    } else {
        // If auth is not ready, keep loading.
        setLoading(true);
    }
  }, [auth]);

  const value = { user, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
