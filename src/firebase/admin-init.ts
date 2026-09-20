import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';

let adminApp: App;

if (getApps().length === 0) {
  adminApp = initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  });
} else {
  adminApp = getApp();
}

// Target the custom Firestore named database "vidyaeducaredatabase"
const adminDb: Firestore = getFirestore(adminApp, "vidyaeducaredatabase");
const adminAuth: Auth = getAuth(adminApp);
const adminStorage: Storage = getStorage(adminApp);

export { adminDb, adminAuth, adminStorage };
