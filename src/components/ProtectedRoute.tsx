"use client";

import { useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait until authentication state is loaded
    }

    if (adminOnly) {
      // This is an admin-only area.
      if (!user || !isAdmin) {
        // Redirection is now handled by the central FirebaseProvider
        // This just prevents rendering the children if the state is wrong
        return;
      }
    } else { 
      // For regular user-protected routes
      if (!user) {
         // Redirection is now handled by the central FirebaseProvider
        return;
      }
    }
  }, [user, loading, isAdmin, adminOnly, router]);

  // While loading authentication state, show a global spinner.
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // If the conditions aren't met, return null while the provider handles the redirect.
  if (adminOnly && (!user || !isAdmin)) {
     return null;
  }
  if (!adminOnly && !user) {
     return null;
  }
  
  // If all checks pass, render the children components.
  return <>{children}</>;
}
