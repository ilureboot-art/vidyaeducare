
"use client";

import { useAuth } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
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
      // 1. Not logged in: Send to appropriate login page
      const targetPath = adminOnly ? '/admin/login' : '/login';
      router.replace(targetPath);
    } else if (adminOnly && !isAdmin) {
      // 2. Logged in but not an admin trying to access admin pages: Force out
      router.replace('/profile');
    } else if (!adminOnly && isAdmin) {
      // 3. Admin trying to access regular user pages: Force to admin area
      router.replace('/admin/analytics');
    }
  }, [loading, user, isAdmin, adminOnly, router]);

  // Show a clean loading state while verifying permissions
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh] space-y-4">
        <Loader2 className="animate-spin text-primary h-10 w-10" />
        <p className="text-muted-foreground text-sm font-medium">Verifying access rights...</p>
      </div>
    );
  }

  // Final barrier: Only render children if the role perfectly matches requirements
  if (!user) return null;
  if (adminOnly && !isAdmin) return null;
  if (!adminOnly && isAdmin) return null;

  return <>{children}</>;
}
