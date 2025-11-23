
"use client";

import { AuthGuard } from "./AuthGuard";

/**
 * @deprecated This component is deprecated. Use <AuthGuard> directly in your layout components.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // This component now just wraps AuthGuard for backward compatibility if it's still used somewhere.
  // The primary protection logic is now in AppLayout using AuthGuard.
  return <>{children}</>;
}
