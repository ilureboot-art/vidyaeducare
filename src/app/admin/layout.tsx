
"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Notifications } from "@/components/admin/Notifications";
import ProtectedRoute from "@/components/ProtectedRoute";
import { usePathname } from "next/navigation";
import { useAuth } from "@/firebase";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // This layout now wraps all /admin routes, including the login page.
  // The ProtectedRoute handles logic for all child routes.
  // We conditionally render the sidebar based on the path.
  const isLoginPage = pathname === "/admin/login";

  return (
    <ProtectedRoute adminOnly>
      {isLoginPage ? (
        // Render only the children (the login page) without any surrounding layout
        <>{children}</>
      ) : (
        // For all other admin pages, render the full dashboard layout
        <SidebarProvider>
          <div className="flex min-h-screen">
            <AdminSidebar />
            <SidebarInset className="flex-1 flex flex-col">
              <header className="p-4 border-b flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <SidebarTrigger className="md:hidden" />
                    <h1 className="text-xl font-semibold">Admin Panel</h1>
                </div>
                <Notifications />
              </header>
              <main className="flex-1 p-8 bg-muted/40">
                {children}
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      )}
    </ProtectedRoute>
  );
}
