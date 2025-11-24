
"use client";

import { useAuth } from "@/firebase/provider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export function AuthGuard({
  children,
  adminOnly = false,
  isPublic = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
  isPublic?: boolean;
}) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || isPublic) {
      return; // Wait for auth or if page is public
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
  }, [user, loading, isAdmin, adminOnly, isPublic, router, pathname]);

  // While loading auth state for a protected route, show a loader
  if (loading && !isPublic) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }
  
  // If all checks pass, render the children
  return <>{children}</>;
}
