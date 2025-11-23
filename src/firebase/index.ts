
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { firebaseConfig } from "./config";

let firebaseApp: FirebaseApp;
let firestore: Firestore;
let auth: Auth;

function initializeFirebase() {
    if (getApps().length === 0) {
        firebaseApp = initializeApp(firebaseConfig);
        firestore = getFirestore(firebaseApp);
        auth = getAuth(firebaseApp);
        try {
            enableIndexedDbPersistence(firestore);
        } catch (error: any) {
            if (error.code == 'failed-precondition') {
                console.warn('Firestore persistence failed: multiple tabs open.');
            } else if (error.code == 'unimplemented') {
                console.warn('Firestore persistence not supported in this browser.');
            }
        }
    } else {
        firebaseApp = getApp();
        firestore = getFirestore(firebaseApp);
        auth = getAuth(firebaseApp);
    }
    return { app: firebaseApp, db: firestore, auth };
}

// Export the initialized services
const { app, db, auth: authService } = initializeFirebase();
export { app, db, authService };

// Export hooks and providers from the new provider file
export { FirebaseProvider, useAuth, useFirebase, useFirebaseApp, useFirestore, useAuthService } from './provider';
