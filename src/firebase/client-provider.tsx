
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { initializeFirebaseOnClient } from './client-init'; 
import { type Auth, type User } from 'firebase/auth';
import { type Firestore } from 'firebase/firestore';

interface FirebaseServices {
    auth: Auth;
    db: Firestore;
}

const AuthContext = createContext<User | null>(null);
const AuthServiceContext = createContext<Auth | undefined>(undefined);
const DbContext = createContext<Firestore | undefined>(undefined);

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
    const [services, setServices] = useState<FirebaseServices | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        initializeFirebaseOnClient()
            .then(setServices)
            .catch((err) => {
                setError(err.message || "Could not initialize Firebase.");
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (services) {
            const unsubscribe = services.auth.onAuthStateChanged(user => {
                setUser(user);
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [services]);

    if (loading) {
        return <div>Loading...</div>; // Replace with a proper loader
    }
    
    if (error) {
        return <div>Error: {error}</div>; // Replace with a proper error component
    }

    return (
        <AuthContext.Provider value={user}>
            <AuthServiceContext.Provider value={services?.auth}>
                <DbContext.Provider value={services?.db}>
                    {children}
                </DbContext.Provider>
            </AuthServiceContext.Provider>
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
export const useAuthService = () => useContext(AuthServiceContext);
export const useDbService = () => useContext(DbContext);
