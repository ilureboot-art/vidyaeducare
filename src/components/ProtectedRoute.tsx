
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
      // This is an admin-only area.
      if (!user || !isAdmin) {
        // If not an admin, redirect to the admin login page.
        router.replace("/admin/login");
      } else if (user && isAdmin && pathname === "/admin/login") {
        // CRITICAL FIX: If an authenticated admin lands on the login page,
        // redirect them to the dashboard immediately.
        router.replace("/admin/analytics");
      }
    } else { 
      // For regular user-protected routes
      if (!user) {
        router.replace("/login");
      }
    }
  }, [user, loading, isAdmin, adminOnly, router, pathname]);

  // While loading authentication state, show a global spinner.
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // If we are protecting an admin route and the user is not an admin, show a spinner
  // while the redirect is in progress. This prevents flashing the content.
  if (adminOnly && (!user || !isAdmin)) {
     return (
        <div className="flex justify-center items-center h-screen">
          <p>Redirecting to login...</p>
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      );
  }

  // Same for regular protected routes.
  if (!adminOnly && !user) {
     return (
        <div className="flex justify-center items-center h-screen">
          <p>Redirecting to login...</p>
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      );
  }
  
  // If all checks pass, render the children components.
  return <>{children}</>;
}
