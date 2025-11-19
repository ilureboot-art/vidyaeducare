
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, browserLocalPersistence, Auth } from "firebase/auth";
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

// Singleton instances
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

function initializeFirebase() {
  if (getApps().length) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
  }

  auth = getAuth(app);
  db = getFirestore(app);

  if (typeof window !== 'undefined') {
    // Enable offline persistence only on the client-side
    try {
        enableIndexedDbPersistence(db)
            .catch((error) => {
                if (error.code == 'failed-precondition') {
                    console.warn("Firestore offline persistence failed: Multiple tabs open.");
                } else if (error.code == 'unimplemented') {
                    console.warn("Firestore offline persistence failed: Browser does not support it.");
                }
            });
    } catch (error) {
        console.error("Error enabling Firestore offline persistence:", error);
    }
  }
}

// Initialize on first import
if (!getApps().length) {
    initializeFirebase();
} else {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
}

export { app, auth, db };
