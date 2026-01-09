
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
      return; 
    }

    // If trying to access an admin-only page
    if (adminOnly) {
      if (!user) {
        // If not logged in, redirect to the correct admin login page.
        router.replace("/admin/login");
        return;
      }
      if (!isAdmin) {
        // If logged in but not an admin, send them to the user homepage.
        router.replace("/");
        return;
      }
      // **NEW LOGIC**: If an admin is already logged in and somehow lands on the login page,
      // redirect them to the dashboard. This prevents them from getting stuck.
      if (isAdmin && pathname === "/admin/login") {
        router.replace("/admin/analytics");
        return;
      }
    } else { // For regular protected routes
      if (!user) {
        router.replace("/login");
        return;
      }
    }
    
  }, [user, loading, isAdmin, adminOnly, router, pathname]);

  // Show a loading spinner while auth state is being determined
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }
  
  // If an admin is on the login page, show a loader while redirecting to the dashboard.
  if (isAdmin && pathname === "/admin/login") {
      return (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="ml-2">Redirecting to dashboard...</p>
        </div>
      );
  }

  // Prevent rendering children if user is not authorized, to avoid flash of content
  if ((adminOnly && !isAdmin) || (!adminOnly && !user)) {
     return (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      )
  }

  return <>{children}</>;
}
