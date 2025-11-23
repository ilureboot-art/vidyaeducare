
"use client";

import { useAuth } from "@/context/FirebaseClientProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export function AuthGuard({
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
      return; // Wait for authentication state to resolve
    }

    if (!user) {
      // If not logged in, redirect to the appropriate login page
      const loginPath = adminOnly ? "/admin/login" : "/login";
      router.replace(loginPath);
      return;
    }

    if (adminOnly && !isAdmin) {
      // If it's an admin route and the user is not an admin, redirect to home
      router.replace("/");
    }
  }, [user, loading, isAdmin, adminOnly, router, pathname]);

  // While loading or if the user is not yet determined, show a loader
  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // If this is an admin route, verify admin status before rendering
  if (adminOnly && !isAdmin) {
    // Show a loader while redirecting
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }
  
  // If all checks pass, render the children
  return <>{children}</>;
}
