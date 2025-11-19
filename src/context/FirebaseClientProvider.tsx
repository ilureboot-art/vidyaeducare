
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeFirebase } from '@/lib/firebase';
import { type FirebaseApp } from "firebase/app";
import { type Auth } from "firebase/auth";
import { type Firestore } from "firebase/firestore";
import { Loader2 } from 'lucide-react';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  loading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({ app: null, auth: null, db: null, loading: true });

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [firebaseServices, setFirebaseServices] = useState<Omit<FirebaseContextType, 'loading'>>({ app: null, auth: null, db: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { app, auth, db } = await initializeFirebase();
      setFirebaseServices({ app, auth, db });
      setLoading(false);
    };

    init();
  }, []);

  // While firebase services are loading, we show a spinner.
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={{ ...firebaseServices, loading }}>
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
