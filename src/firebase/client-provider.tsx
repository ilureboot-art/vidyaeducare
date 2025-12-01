
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import { getFirestore, doc, getDoc, type Firestore } from 'firebase/firestore';
import type { Admin } from '@/lib/admin-data';

// --- 1. Firebase Configuration ---
const firebaseConfig = {
  "projectId": "vidyaeducare",
  "appId": "1:759861893307:web:9c8d51835795392bc6b19e",
  "storageBucket": "vidyaeducare.appspot.com",
  "apiKey": "AIzaSyBvwttvsCmg-gL3RBXsxfhHPccIAssXWFo",
  "authDomain": "vidyaeducare.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "759861893307"
};

// --- 2. Initialize Firebase App and Services (Singleton Pattern) ---
const firebaseApp: FirebaseApp = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

const auth: Auth = getAuth(firebaseApp);
const db: Firestore = getFirestore(firebaseApp);

// --- 3. Define Authentication State Context ---
interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isHeadAdmin: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

// --- 4. Create a Single Provider Component for Authentication State ---
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<Omit<AuthState, 'loading'>>({
    user: null,
    isAdmin: false,
    isHeadAdmin: false,
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
  }, []);

  const authContextValue = useMemo(() => ({
    ...authState,
    loading: isAuthLoading,
  }), [authState, isAuthLoading]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// --- 5. Export Public Hooks for Accessing Context and Services ---
export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseClientProvider');
  }
  return context;
};

export const useAuthService = (): Auth => {
  return auth;
};

export const useDbService = (): Firestore => {
  return db;
};
