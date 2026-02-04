
"use client";

import { useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * A component that wraps protected routes to ensure proper authentication
 * and role-based access control.
 */
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
    if (loading) return;

    if (!user) {
      const targetPath = adminOnly ? '/admin/login' : '/login';
      router.replace(targetPath);
    } else if (adminOnly && !isAdmin) {
      router.replace('/profile');
    } else if (!adminOnly && isAdmin) {
      router.replace('/admin/analytics');
    }
  }, [loading, user, isAdmin, adminOnly, router]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh] space-y-4">
        <Loader2 className="animate-spin text-primary h-10 w-10" />
        <p className="text-muted-foreground text-sm font-medium">Verifying access...</p>
      </div>
    );
  }

  // Barrier: Only render if role matches
  if (!user) return null;
  if (adminOnly && !isAdmin) return null;
  if (!adminOnly && isAdmin) return null;

  return <>{children}</>;
}
