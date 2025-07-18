
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page now acts as a redirect to the new IBA Dashboard.
export default function ReferRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/iba/dashboard");
  }, [router]);

  return (
    <div className="w-full h-full flex items-center justify-center">
        <p>Redirecting to your IBA Dashboard...</p>
    </div>
  );
}
