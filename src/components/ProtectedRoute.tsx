
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

  // Wait for the central provider to resolve identity and role
  if (loading) return null;

  // If identity is missing, provide no output (Provider handles redirect)
  if (!user) return null;
  
  if (adminOnly) {
    // If it's an admin route, regular users are strictly barred
    if (!isAdmin) return null;
  } else {
    // If it's a student route, Admins are strictly barred to prevent shell leakage
    // Admins must remain in the /admin/* environment
    if (isAdmin && !pathname.startsWith('/admin')) return null;
  }

  return <>{children}</>;
}
