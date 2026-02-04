
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
    // Redirection is now primarily handled by the central FirebaseProvider.
    // This component acts as a local gatekeeper to ensure users aren't seeing
    // content they shouldn't while the provider's logic resolves.
    if (!loading && !user) {
      const targetPath = adminOnly ? '/admin/login' : '/login';
      router.replace(targetPath);
    }
  }, [loading, user, adminOnly, router]);

  // While checking auth state, show a clean loader
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh] space-y-4">
        <Loader2 className="animate-spin text-primary h-10 w-10" />
        <p className="text-muted-foreground text-sm font-medium">Securing session...</p>
      </div>
    );
  }

  // If user is not authenticated, or they try to access admin area without permissions,
  // return null. The FirebaseProvider will handle the redirect.
  if (!user || (adminOnly && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
}
