
"use client";

// This file is deprecated and its logic has been merged into FirebaseClientProvider.
// It is kept here to prevent breaking imports, but it should not be used directly.
// useAuth should now be imported from '@/context/FirebaseClientProvider'
import { useAuth as useCombinedAuth } from '@/context/FirebaseClientProvider';

export const useAuth = useCombinedAuth;

// The AuthProvider is no longer needed as FirebaseClientProvider handles auth state.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
