
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { firebaseConfig } from "./config";

// This function will be called by the provider
function initializeFirebase() {
    if (getApps().length > 0) {
        const app = getApp();
        const db = getFirestore(app);
        const auth = getAuth(app);
        return { app, db, auth };
    }
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    // Enable persistence if not in a server environment
    if (typeof window !== 'undefined') {
        try {
            enableIndexedDbPersistence(db);
        } catch (error: any) {
            if (error.code == 'failed-precondition') {
                console.warn('Firestore persistence failed: multiple tabs open.');
            } else if (error.code == 'unimplemented') {
                console.warn('Firestore persistence not supported in this browser.');
            }
        }
    }
    
    return { app, db, auth };
}


// Export the new provider and hooks
export { FirebaseProvider, useAuth, useFirebase, useFirebaseApp, useFirestore, useAuthService } from './provider';

// Export the initializer
export { initializeFirebase };
