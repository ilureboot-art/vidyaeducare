
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

// Initialize Firebase for client-side
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== 'undefined') {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
        auth = initializeAuth(app, {
          persistence: browserLocalPersistence
        });
        db = getFirestore(app);
        
        try {
            enableIndexedDbPersistence(db)
                .catch((error) => {
                    if (error.code == 'failed-precondition') {
                        console.warn("Firestore offline persistence failed: Multiple tabs open, persistence can only be enabled in one tab at a time.");
                    } else if (error.code == 'unimplemented') {
                        console.warn("Firestore offline persistence failed: The current browser does not support all of the features required to enable persistence.");
                    }
                });
        } catch (error) {
            console.error("Error enabling Firestore offline persistence:", error);
        }
    } else {
        app = getApp();
        auth = getAuth(app);
        db = getFirestore(app);
    }
} else {
    // For server-side rendering, initialize a temporary app instance.
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
}


export { app, auth, db };
