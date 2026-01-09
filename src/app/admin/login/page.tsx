
"use client";

// This file is deprecated and its logic has been moved to /src/app/admin-login/page.tsx
// It is kept here temporarily to avoid breaking builds but should be removed.
// The redirect in next.config.js handles routing.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DeprecatedAdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin-login');
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="animate-spin text-primary" size={32} />
      <p className="ml-2">Redirecting to login...</p>
    </div>
  );
}

    