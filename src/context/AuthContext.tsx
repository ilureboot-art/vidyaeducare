
"use client";

// This file is deprecated. All its logic has been merged into FirebaseProvider.
// It is kept here only to prevent breaking any legacy imports, but it should not be used.
// useAuth should now be imported from '@/firebase'

export { useAuth } from '@/firebase';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
