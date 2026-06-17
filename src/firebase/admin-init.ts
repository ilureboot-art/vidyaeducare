import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App;

if (getApps().length === 0) {
  adminApp = initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  });
} else {
  adminApp = getApp();
}

// Target the custom Firestore named database "vidyaeducaredatabase"
const adminDb: Firestore = getFirestore(adminApp, "vidyaeducaredatabase");
const adminAuth: Auth = getAuth(adminApp);

export { adminDb, adminAuth };
