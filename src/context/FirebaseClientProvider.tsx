
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeFirebase } from '@/lib/firebase';
import { type FirebaseApp } from "firebase/app";
import { type Auth, onAuthStateChanged, type User } from "firebase/auth";
import { type Firestore } from "firebase/firestore";
import { Loader2 } from 'lucide-react';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  user: User | null;
  loading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({ app: null, auth: null, db: null, user: null, loading: true });

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Omit<FirebaseContextType, 'loading' | 'user'>>({ app: null, auth: null, db: null });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { app, auth, db } = await initializeFirebase();
      setServices({ app, auth, db });

      if (auth) {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setUser(user);
          setLoading(false);
        });
        // Cleanup subscription on unmount
        return () => unsubscribe();
      } else {
        setLoading(false);
      }
    };

    init();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={{ ...services, user, loading }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseClientProvider");
  }
  return context;
}

export function useAuth() {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within a FirebaseClientProvider");
    }
    return { user: context.user, loading: context.loading };
}
