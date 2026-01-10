
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
      // If it's an admin-only area
      if (!isAdmin) {
        // If not an admin, redirect to admin login
        router.replace("/admin/login");
      } else if (pathname === "/admin/login") {
        // If an admin is on the login page, redirect them to the dashboard
        router.replace("/admin/analytics");
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

  // If checks are still running or a redirect is pending, show a spinner
  // This prevents a flash of content before redirection.
  if (adminOnly && (!isAdmin || pathname === "/admin/login")) {
     return (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      );
  }
   if (!adminOnly && !user) {
     return (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      );
  }
  
  // If all checks pass, render the children components.
  return <>{children}</>;
}
