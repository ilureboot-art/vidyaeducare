
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, browserLocalPersistence, Auth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  "projectId": "vidyaeducare",
  "appId": "1:759861893307:web:9c8d51835795392bc6b19e",
  "apiKey": "AIzaSyBvwttvsCmg-gL3RBXsxfhHPccIAssXWFo",
  "authDomain": "vidyaeducare.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "759861893307"
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== 'undefined') {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);

    // It's important to use initializeAuth here to ensure persistence is set correctly,
    // especially in a Next.js environment. Using getAuth() directly can sometimes
    // lead to race conditions with persistence.
    auth = initializeAuth(app, {
      persistence: browserLocalPersistence
    });

    db = getFirestore(app);

    // Enable Firestore offline persistence
    try {
        enableIndexedDbPersistence(db)
            .then(() => console.log("Firestore offline persistence enabled."))
            .catch((error) => {
                if (error.code === 'failed-precondition') {
                    console.warn("Firestore offline persistence failed: can only be enabled in one tab at a time.");
                } else if (error.code === 'unimplemented') {
                    console.warn("Firestore offline persistence is not supported in this browser.");
                }
            });
    } catch (error: any) {
      console.error("Error enabling Firestore persistence:", error);
    }
} else {
    // For server-side rendering, initialize a temporary app instance.
    // This won't have persistence, but it prevents errors during SSR.
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
}

export { app, auth, db };
