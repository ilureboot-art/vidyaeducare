"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function PlayPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader>
            <CardTitle>Redirecting...</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[200px] flex flex-col items-center justify-center text-center space-y-4">
          <Loader2 className="animate-spin text-primary" size={32} />
          <CardDescription>The game feature has been removed. Redirecting to the homepage.</CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
