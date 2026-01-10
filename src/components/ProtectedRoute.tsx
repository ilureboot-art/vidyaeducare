
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

    if (adminOnly) {
      // If not an admin, redirect to admin login
      if (!isAdmin) {
        router.replace("/admin/login");
        return;
      }
      
      // If IS an admin but is on the login page, redirect to dashboard
      if (isAdmin && pathname === "/admin/login") {
        router.replace("/admin/analytics");
        return;
      }
    } 
    else { // For regular user routes
      if (!user) {
        router.replace("/login");
        return;
      }
    }
  }, [user, loading, isAdmin, adminOnly, router, pathname]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // If checks are still running or a redirect is pending, show loader
  if ((adminOnly && !isAdmin) || (!adminOnly && !user)) {
     return (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      );
  }
  
  // If all checks pass, render the children components.
  return <>{children}</>;
}
