
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

  // Enforce access rules synchronously
  if (!user) return null;
  if (adminOnly && !isAdmin) return null;
  if (!adminOnly && isAdmin) return null;

  return <>{children}</>;
}
