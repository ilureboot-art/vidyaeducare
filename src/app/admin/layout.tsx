
"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Notifications } from "@/components/admin/Notifications";
import { usePathname } from 'next/navigation';
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // The ProtectedRoute logic is now handled by individual pages to prevent layout-based conflicts.

  return (
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
  );
}
