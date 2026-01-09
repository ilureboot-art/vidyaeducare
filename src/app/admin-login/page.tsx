
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// This page is now deprecated and exists only to redirect any old bookmarks
// to the new, correct admin login location.
export default function DeprecatedAdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/login");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Redirecting...</CardTitle>
          <CardDescription>
            The admin login page has moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p>Please wait, we're taking you to the new login page.</p>
        </CardContent>
      </Card>
    </div>
  );
}
