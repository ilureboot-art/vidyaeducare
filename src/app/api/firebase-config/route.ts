
import { NextResponse } from 'next/server';

// This API route is no longer the primary method for client-side config loading
// but is kept for potential server-side use or reference.
// The client now initializes Firebase directly from environment variables.
export function GET() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!firebaseConfig.apiKey) {
    return NextResponse.json({ error: 'Firebase server environment variables are not configured.' }, { status: 500 });
  }

  return NextResponse.json(firebaseConfig);
}
