
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import { getFirestore, doc, getDoc, type Firestore } from 'firebase/firestore';
import type { Admin } from '@/lib/admin-data';
import { Loader2 } from 'lucide-react';

// --- 1. Firebase Configuration ---
// This is defined directly here to prevent any import/export issues.
const firebaseConfig = {
  projectId: "vidyaeducare",
  appId: "1:759861893307:web:9c8d51835795392bc6b19e",
  storageBucket: "vidyaeducare.appspot.com",
  apiKey: "AIzaSyBvwttvsCmg-gL3RBXsxfhHPccIAssXWFo",
  authDomain: "vidyaeducare.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "759861893307",
};

// --- 2. Service & Auth Context Definitions ---
interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isHeadAdmin: boolean;
}

const FirebaseContext = createContext<FirebaseServices | undefined>(undefined);
const AuthContext = createContext<AuthState | undefined>(undefined);

// --- 3. The Single Provider Component ---
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<FirebaseServices | null>(null);
  const [authState, setAuthState] = useState<Omit<AuthState, 'loading'>>({
    user: null,
    isAdmin: false,
    isHeadAdmin: false,
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // --- Initialize Firebase ONCE on client mount using useEffect ---
  useEffect(() => {
    // This hook guarantees the code inside only runs on the client, after the component has mounted.
    if (typeof window !== 'undefined' && !services) {
      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const db = getFirestore(app);
      setServices({ app, auth, db });
    }
  }, [services]); // The dependency array ensures this runs only when `services` changes (i.e., once on init)

  // --- Listen for Auth State Changes ---
  useEffect(() => {
    if (!services) return; // Don't run if Firebase services aren't initialized yet

    const { auth, db } = services;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthLoading(true);
      if (user) {
        try {
          const adminDocRef = doc(db, "admins", user.uid);
          const adminDocSnap = await getDoc(adminDocRef);
          const isAdmin = adminDocSnap.exists() && adminDocSnap.data().status === 'Active';
          const isHeadAdmin = isAdmin && (adminDocSnap.data() as Admin).role === 'Head Admin';
          setAuthState({ user, isAdmin, isHeadAdmin });
        } catch (e) {
          console.error("Error checking admin status:", e);
          setAuthState({ user, isAdmin: false, isHeadAdmin: false });
        }
      } else {
        setAuthState({ user: null, isAdmin: false, isHeadAdmin: false });
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, [services]); // This effect depends on `services` being available

  const authContextValue = useMemo(() => ({
    ...authState,
    loading: isAuthLoading || !services, // Loading if auth is changing OR services aren't ready
  }), [authState, isAuthLoading, services]);

  // While services are being initialized for the very first time, show a full-page loader.
  if (!services) {
    return (
        <div className="flex justify-center items-center h-screen w-screen">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
    );
  }

  return (
    <FirebaseContext.Provider value={services}>
      <AuthContext.Provider value={authContextValue}>
        {children}
      </AuthContext.Provider>
    </FirebaseContext.Provider>
  );
}

// --- 4. Public Hooks ---
export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseClientProvider');
  }
  return context;
};

const useFirebaseServices = (): FirebaseServices => {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useFirebaseServices must be used within a FirebaseClientProvider');
    }
    return context;
};

export const useAuthService = () => useFirebaseServices().auth;
export const useDbService = () => useFirebaseServices().db;
