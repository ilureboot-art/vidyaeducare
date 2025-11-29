
"use client";

// This file is a "barrel" file. Its only job is to re-export hooks and providers
// from other modules so that the rest of the application can have a single
// point of import for all Firebase-related functionality.

export { FirebaseClientProvider } from './client-provider';
export { useAuth, useAuthService, useDbService } from './provider';
