
"use client";

import { useAuth } from "@/firebase";

/**
 * A high-performance gatekeeper component.
 * It leverages the pre-resolved auth state from FirebaseProvider
 * to render content immediately without redundant loading states.
 */
export default function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, loading, isAdmin } = useAuth();

  // If the global provider is still loading, we do nothing.
  // The FirebaseProvider handles its own full-screen loader.
  if (loading) return null;

  // Pure Security Barrier: If role requirements are not met, render nothing.
  // The central redirection logic in FirebaseProvider will handle moving the user.
  if (!user) return null;
  if (adminOnly && !isAdmin) return null;
  if (!adminOnly && isAdmin) return null;

  return <>{children}</>;
}
