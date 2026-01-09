
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
  
  // The login page is now part of this layout.
  // We don't want to show the sidebar or header on the login page.
  if (pathname === "/admin/login") {
    // The login page itself handles its own logic, and doesn't need the sidebar.
    // The redirect from login is handled by the login page component itself.
    return <>{children}</>;
  }

  // The rest of the admin panel is protected and gets the full sidebar layout.
  return (
    <ProtectedRoute adminOnly>
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
    </ProtectedRoute>
  );
}
