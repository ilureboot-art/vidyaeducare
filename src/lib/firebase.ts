
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "vidyaeducare",
  "appId": "1:759861893307:web:9c8d51835795392bc6b19e",
  "apiKey": "AIzaSyBvwttvsCmg-gL3RBXsxfhHPccIAssXWFo",
  "authDomain": "vidyaeducare.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "759861893307"
};

// Singleton instances for the services
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Flag to track if persistence has been enabled
let persistenceEnabled = false;

function initializeFirebase() {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    
    auth = getAuth(app);
    db = getFirestore(app);

    // Try to enable offline persistence only on the client and only once
    if (typeof window !== 'undefined' && !persistenceEnabled) {
        enableIndexedDbPersistence(db)
            .then(() => {
                persistenceEnabled = true;
            })
            .catch((err) => {
                if (err.code === 'failed-precondition') {
                    console.warn("Firestore offline persistence failed: Multiple tabs open.");
                } else if (err.code === 'unimplemented') {
                    console.warn("Firestore offline persistence not supported in this browser.");
                }
            });
    }
}

// Initialize Firebase immediately on module load
initializeFirebase();

// Export the singleton instances
export { app, auth, db };
