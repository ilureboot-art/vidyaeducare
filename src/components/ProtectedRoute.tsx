
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
    if (loading) return;

    if (!user) {
      // Not logged in: send to correct login gate
      const targetPath = adminOnly ? '/admin/login' : '/login';
      router.replace(targetPath);
    } else if (adminOnly && !isAdmin) {
      // Logged in but not an admin: forcefully remove from admin area
      router.replace('/profile');
    }
  }, [loading, user, isAdmin, adminOnly, router]);

  // While checking auth state or database role, show a loader
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh] space-y-4">
        <Loader2 className="animate-spin text-primary h-10 w-10" />
        <p className="text-muted-foreground text-sm font-medium">Verifying access rights...</p>
      </div>
    );
  }

  // Final rendering logic: only render if authorized
  if (!user || (adminOnly && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
}
