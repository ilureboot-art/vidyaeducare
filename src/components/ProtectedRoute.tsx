
"use client";

import { useAuth } from "@/firebase/index";
import { useRouter } from "next/navigation";
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

  useEffect(() => {
    if (loading) {
      return; 
    }

    if (!user) {
      const loginPath = adminOnly ? "/admin/login" : "/login";
      router.replace(loginPath);
      return;
    }

    if (adminOnly && !isAdmin) {
      router.replace("/");
    }
  }, [user, loading, isAdmin, adminOnly, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }
  
  if ((adminOnly && !isAdmin) || !user) {
      return (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      )
  }

  return <>{children}</>;
}
