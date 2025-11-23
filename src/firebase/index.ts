
// This file is the single entry point for all Firebase-related functionality.
// It initializes firebase and exports the services and provider.

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { firebaseConfig } from "./config";

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (getApps().length) {
    app = getApp();
    db = getFirestore(app);
    auth = getAuth(app);
} else {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    if (typeof window !== 'undefined') {
        try {
            enableIndexedDbPersistence(db).catch((err) => {
                 if (err.code == 'failed-precondition') {
                    console.warn('Firestore persistence failed: multiple tabs open.');
                } else if (err.code == 'unimplemented') {
                    console.warn('Firestore persistence not supported in this browser.');
                }
            });
        } catch (error) {
            console.error("Error enabling Firestore persistence:", error);
        }
    }
}

export { app, db, auth };

export { 
    FirebaseProvider, 
    useAuth, 
    useFirebase, 
    useFirebaseApp, 
    useFirestore, 
    useAuthService 
} from './provider';
