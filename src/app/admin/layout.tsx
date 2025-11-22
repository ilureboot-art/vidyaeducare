
"use client";

import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use a ProtectedRoute wrapper if you want to protect all admin routes
  // The logic inside ProtectedRoute will handle redirection if not logged in.
  // For role-based access, that logic would also go inside ProtectedRoute.
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

