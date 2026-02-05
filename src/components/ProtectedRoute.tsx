
"use client";

import { useAuth } from "@/firebase";
import { Loader2 } from "lucide-react";

/**
 * A component that acts as a pure rendering barrier.
 * Redirection logic is handled globally by FirebaseProvider
 * to prevent race conditions and loops.
 */
export default function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh] space-y-4">
        <Loader2 className="animate-spin text-primary h-10 w-10" />
        <p className="text-muted-foreground text-sm font-medium">Verifying access...</p>
      </div>
    );
  }

  // Pure Barrier: If state is wrong, render nothing. 
  // FirebaseProvider will handle moving the user to the right page.
  if (!user) return null;
  if (adminOnly && !isAdmin) return null;
  if (!adminOnly && isAdmin) return null;

  return <>{children}</>;
}
