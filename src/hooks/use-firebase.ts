
'use client';

import { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

interface FirebaseServices {
    app: FirebaseApp | null;
    auth: Auth | null;
    db: Firestore | null;
    loading: boolean;
}

// A single instance to hold the initialized services
let firebaseServices: { app: FirebaseApp, auth: Auth, db: Firestore } | null = null;

export function useFirebase(): FirebaseServices {
    const [services, setServices] = useState<Omit<FirebaseServices, 'loading'>>({
        app: null,
        auth: null,
        db: null,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This effect runs only on the client
        if (!firebaseServices) {
            if (getApps().length === 0) {
                const app = initializeApp(firebaseConfig);
                const auth = getAuth(app);
                const db = getFirestore(app);
                firebaseServices = { app, auth, db };
            } else {
                const app = getApp();
                const auth = getAuth(app);
                const db = getFirestore(app);
                firebaseServices = { app, auth, db };
            }
        }
        
        setServices(firebaseServices);
        setLoading(false);

    }, []);

    return { ...services, loading };
}
