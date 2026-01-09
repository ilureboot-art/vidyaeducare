
"use client";

import React from 'react';
import { FirebaseProvider } from './provider';

// This is a client-only wrapper component.
// Its sole purpose is to be the boundary between Server and Client Components.
// By using it in the root layout, we ensure that the FirebaseProvider
// and its context are only ever rendered on the client, and that they
// persist across all page navigations, preserving the auth state.
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  return <FirebaseProvider>{children}</FirebaseProvider>;
}
