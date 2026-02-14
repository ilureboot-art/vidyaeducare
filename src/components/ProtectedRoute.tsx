"use client";

import { useAuth } from "@/firebase";
import { usePathname } from "next/navigation";

/**
 * A strict security barrier that works in tandem with the FirebaseProvider.
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
  const pathname = usePathname();

  // The provider handles the loading screen and core redirection.
  // This guard simply prevents mismatched content from mounting during the state resolve.
  if (loading) return null;

  if (!user) return null;
  
  if (adminOnly) {
    if (!isAdmin) return null;
  } else {
    // Prevent administrators from rendering student layouts
    if (isAdmin && !pathname.startsWith('/admin')) return null;
  }

  return <>{children}</>;
}
