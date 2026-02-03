
"use client";

import { useAuth } from "@/firebase";
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
    // Redirection is now primarily handled by FirebaseProvider for a unified experience.
    // This component acts as a secondary safety gate and loading boundary.
    if (!loading && !user) {
      const targetPath = adminOnly ? '/admin/login' : '/login';
      router.replace(targetPath);
    }
  }, [loading, user, adminOnly, router]);

  // If loading, or if we need a redirect, show a spinner that matches the provider's style
  if (loading || !user || (adminOnly && !isAdmin)) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh] space-y-4">
        <Loader2 className="animate-spin text-primary h-10 w-10" />
        <p className="text-muted-foreground text-sm font-medium">Securing session...</p>
      </div>
    );
  }

  return <>{children}</>;
}
