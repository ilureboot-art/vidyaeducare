
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
      return;
    }
    
    const isAdminRoute = pathname.startsWith('/admin');

    if (!user) {
      if (isAdminRoute) {
        router.replace("/admin/login");
      } else {
        router.replace("/login");
      }
      return;
    }

    if (isAdminRoute && !isAdmin) {
      router.replace("/");
    }

  }, [user, loading, isAdmin, router, pathname]);

  // Combined loading check
  if (loading || !user || (pathname.startsWith('/admin') && !isAdmin)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return <>{children}</>;
}

    