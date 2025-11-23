
"use client";

// This file is being deprecated. Its logic has been moved to src/firebase/provider.tsx and src/firebase/client-provider.tsx
// It is kept here to re-export the new hooks for backward compatibility.
export { FirebaseClientProvider, useAuth, useFirebase } from '@/firebase/client-provider';
