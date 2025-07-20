
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page is deprecated and has been replaced by the /profile page,
// which now functions as a multi-student management hub.
export default function DeprecatedStudentDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/profile");
  }, [router]);
  
  return null;
}
