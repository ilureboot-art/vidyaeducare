
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function CheckHeadAdminRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/setup');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted">
      <Loader2 className="animate-spin text-primary" size={32} />
      <p className="mt-4">Redirecting to the admin setup page...</p>
    </div>
  );
}
