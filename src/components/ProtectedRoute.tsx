
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
      router.replace(isAdminRoute ? "/admin/login" : "/login");
      return;
    }

    if (isAdminRoute && !isAdmin) {
      router.replace("/");
    }

  }, [user, loading, isAdmin, router, pathname]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return <>{children}</>;
}
