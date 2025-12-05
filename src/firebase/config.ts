
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyARX4ziyytJoYRgSj1Sevq0dGIxLO7PRiY",
  authDomain: "next-on-firebase-serverless-c5a7e.firebaseapp.com",
  projectId: "next-on-firebase-serverless-c5a7e",
  storageBucket: "next-on-firebase-serverless-c5a7e.appspot.com",
  messagingSenderId: "939956486427",
  appId: "1:939956486427:web:05c7b5065a57262f3f035f"
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };
