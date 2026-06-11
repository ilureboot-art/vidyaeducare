
"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Notifications } from "@/components/admin/Notifications";
import { ThemeToggle } from "@/components/ThemeToggle";
import ProtectedRoute from "@/components/ProtectedRoute";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');

  // Do not render the main admin sidebar/header or enforce protection 
  // on the login and setup pages. This prevents a Catch-22 for initialization.
  if (cleanPath === '/admin/login' || cleanPath === '/admin/setup') {
    return <>{children}</>;
  }

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
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Notifications />
                </div>
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
