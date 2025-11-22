
"use client";

import { useAuth } from "@/context/FirebaseClientProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return; // Do nothing while loading
    }
    
    const isAdminRoute = pathname.startsWith('/admin');

    // If not authenticated, redirect to the appropriate login page
    if (!user) {
      if (isAdminRoute) {
        router.replace("/admin/login");
      } else {
        router.replace("/login");
      }
      return;
    }

    // If on an admin route but the user is not an admin, redirect them
    if (isAdminRoute && !isAdmin) {
      router.replace("/"); // or a dedicated "access-denied" page
    }

  }, [user, loading, isAdmin, router, pathname]);

  if (loading) {
    // Show a loader while authentication state is being determined
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }
  
  // If the user is not authenticated yet, continue showing loader until redirect happens.
  if (!user) {
     return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }
  
  // Special handling for admin routes to ensure isAdmin check completes
  if (pathname.startsWith('/admin') && !isAdmin) {
      // While redirecting, show a loader to prevent flashing content
      return (
          <div className="flex justify-center items-center h-screen">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
      );
  }

  return <>{children}</>;
}
