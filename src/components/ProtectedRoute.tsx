
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
    // This component only handles REDIRECTION AWAY if not logged in.
    // Redirection TOWARDS the dashboard is handled by FirebaseProvider.
    if (!loading && !user) {
      const targetPath = adminOnly ? '/admin/login' : '/login';
      router.replace(targetPath);
    }
  }, [loading, user, adminOnly, router]);

  // If we are waiting for auth status
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh] space-y-4">
        <Loader2 className="animate-spin text-primary h-10 w-10" />
        <p className="text-muted-foreground text-sm font-medium">Securing session...</p>
      </div>
    );
  }

  // Final gate: If user is authenticated but doesn't have permissions, show nothing
  // (the FirebaseProvider will eventually redirect them)
  if (!user || (adminOnly && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
}
