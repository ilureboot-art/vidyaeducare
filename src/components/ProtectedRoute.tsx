
"use client";

import { useAuth } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
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
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return; // Wait until authentication state is loaded
    }

    if (adminOnly) {
      // Logic for admin-only routes
      if (!user || !isAdmin) {
        // If not an admin, redirect to the main user login page.
        // The admin login is a separate concern.
        router.replace("/login");
      }
    } else { 
      // For regular user-protected routes
      if (!user) {
        router.replace("/login");
      }
    }
  }, [user, loading, isAdmin, adminOnly, router, pathname]);

  // While loading authentication state, show a spinner.
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // If checks are still running or a redirect is pending, show a spinner.
  // This prevents flashing the content of a protected page before the redirect happens.
  if ((adminOnly && (!user || !isAdmin)) || (!adminOnly && !user)) {
     return (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      );
  }
  
  // If all checks pass, render the children components.
  return <>{children}</>;
}
