
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This file is misplaced and should not be used. 
// Standard Next.js App Router login is at /src/app/admin/login/page.tsx
export default function RedirectToCorrectLogin() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/login');
  }, [router]);
  return null;
}
