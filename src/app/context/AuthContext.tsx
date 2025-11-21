
"use client";

// This file is deprecated. All its logic has been merged into FirebaseClientProvider.
// It is kept here only to prevent breaking any legacy imports, but it should not be used.
// useAuth should now be imported from '@/context/FirebaseClientProvider'

export { useAuth } from '@/context/FirebaseClientProvider';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
