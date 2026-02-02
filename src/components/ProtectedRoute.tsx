
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
    // Don't do anything while the auth state is loading.
    if (loading) {
      return;
    }

    // If loading is complete and there's no user, redirect to the correct login page.
    if (!user) {
      const targetPath = adminOnly ? '/admin/login' : '/login';
      router.replace(targetPath);
      return;
    }

    // If this is an admin-only route and the logged-in user is not an admin,
    // redirect them away to their user profile.
    if (adminOnly && !isAdmin) {
      router.replace('/profile');
    }
  }, [loading, user, isAdmin, adminOnly, router]);

  // While loading, or if conditions for rendering children are not met yet
  // (e.g., redirect is imminent), show a loading spinner.
  if (loading || !user || (adminOnly && !isAdmin)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // If all checks pass (user exists and has the correct role), render the protected content.
  return <>{children}</>;
}
