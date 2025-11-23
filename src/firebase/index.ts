'use client';

// This file serves as a single entry point for all Firebase-related functionality.
export { FirebaseProvider, useAuth, useFirebase, useAuthService } from './provider';
export { db, auth } from './client';
export { getFirebase } from './client';