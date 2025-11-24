
"use client";

// This file is deprecated and no longer used.
// All Firebase provider logic is now consolidated in `src/firebase/provider.tsx`.
// This file can be safely deleted.

import React from 'react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useAuth() {
    console.warn("useAuth from src/context/AuthContext.tsx is deprecated. Please import from @/firebase/provider.");
    return {
        user: null,
        loading: true,
        isAdmin: false,
        isHeadAdmin: false,
    };
}
