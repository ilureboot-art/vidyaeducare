
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, browserLocalPersistence } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

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
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// It's important to use initializeAuth here to ensure persistence is set correctly,
// especially in a Next.js environment. Using getAuth() directly can sometimes
// lead to race conditions with persistence.
const auth = initializeAuth(app, {
  persistence: browserLocalPersistence
});

const db = getFirestore(app);

// Enable Firestore offline persistence
try {
  enableIndexedDbPersistence(db);
} catch (error: any) {
  if (error.code == 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one.
    // This is a normal scenario.
    console.warn("Firestore offline persistence failed: multiple tabs open.");
  } else if (error.code == 'unimplemented') {
    // The current browser does not support all of the
    // features required to enable persistence
    console.warn("Firestore offline persistence is not supported in this browser.");
  }
}


export { app, auth, db };
