
"use client";

import { useAuth } from "@/firebase";

/**
 * A secondary security barrier that works in tandem with the FirebaseProvider.
 * It prevents restricted UI from rendering for even a single frame.
 */
export default function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, loading, isAdmin } = useAuth();

  // Wait for the central provider to resolve
  if (loading) return null;

  // Enforce access rules synchronously to prevent flash of wrong content
  if (!user) return null;
  
  if (adminOnly) {
    if (!isAdmin) return null;
  } else {
    // If it's a student route, Admins should be barred
    if (isAdmin) return null;
  }

  return <>{children}</>;
}
