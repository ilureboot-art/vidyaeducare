
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

  // While loading authentication state, show a global spinner.
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // --- Gatekeeping Logic ---
  // If we are here, loading is false. Now, we decide if we should render children.
  // Redirection is now fully handled by the central FirebaseProvider.
  
  if (adminOnly) {
    // For admin-only routes
    if (user && isAdmin) {
      return <>{children}</>; // Access granted for admin
    }
  } else {
    // For regular user-protected routes
    if (user) {
      return <>{children}</>; // Access granted for any logged-in user
    }
  }
  
  // If access is not granted, render nothing. The FirebaseProvider is already
  // handling the redirection, so we just prevent the protected content from flashing.
  return null;
}
