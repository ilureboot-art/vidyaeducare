
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
        router.replace("/admin/login");
        return;
      }
      if (!isAdmin) {
        router.replace("/"); // or a dedicated "access-denied" page
        return;
      }
    }

    // If trying to access a regular protected page (not admin-only)
    if (!adminOnly && !user) {
      router.replace("/login");
      return;
    }
    
    // If a logged-in admin somehow lands on the login page, redirect them
    if (isAdmin && user && pathname === "/admin/login") {
        router.replace("/admin/analytics");
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
  
  // Prevent rendering children if user is not authorized, to avoid flash of content
  if (adminOnly && !isAdmin) {
      return (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      )
  }
  if (!adminOnly && !user) {
     return (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      )
  }

  return <>{children}</>;
}
