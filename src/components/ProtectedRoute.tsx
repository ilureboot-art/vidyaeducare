
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

  // The provider handles the core state resolve.
  if (loading) return null;

  if (!user) return null;
  
  if (adminOnly) {
    // Block non-admins from admin zones
    if (!isAdmin) return null;
  } else {
    // CRITICAL: Block administrators from player-only pages.
    // This prevents the student layout (header/navbar) from leaking into the admin session.
    if (isAdmin && !pathname.startsWith('/admin')) return null;
  }

  return <>{children}</>;
}
