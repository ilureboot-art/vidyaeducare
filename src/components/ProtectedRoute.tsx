
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
    // Don't do anything while auth state is loading
    if (loading) {
      return;
    }

    // --- Admin Route Protection ---
    if (adminOnly) {
      // If user is not logged in, redirect to admin login page
      if (!user) {
        router.replace("/admin/login");
        return;
      }
      
      // If user is logged in but is not an admin, redirect to user homepage
      if (!isAdmin) {
        router.replace("/");
        return;
      }
      
      // *** CRITICAL FIX ***
      // If user IS an admin and is currently on the login page,
      // redirect them to the dashboard. This prevents them from being stuck.
      if (isAdmin && pathname === "/admin/login") {
        router.replace("/admin/analytics");
        return;
      }
    } 
    // --- Regular User Route Protection ---
    else {
      if (!user) {
        router.replace("/login");
        return;
      }
    }
  }, [user, loading, isAdmin, adminOnly, router, pathname]);

  // Show a loading spinner while auth state is being determined.
  // This covers the initial load and any flashes during navigation.
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // If the logic determines a redirect is needed, show a loader
  // while the router is navigating away. This prevents flashing
  // the unauthorized content.
  if (adminOnly && !isAdmin) {
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
