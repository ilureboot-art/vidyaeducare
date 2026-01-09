
"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Notifications } from "@/components/admin/Notifications";
import ProtectedRoute from "@/components/ProtectedRoute";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Conditionally render the sidebar based on the path.
  // The login page will not have the sidebar.
  const isLoginPage = pathname === "/admin/login";

  return (
    <ProtectedRoute adminOnly>
        <SidebarProvider>
          <div className="flex min-h-screen">
            {!isLoginPage && <AdminSidebar />}
            <SidebarInset className="flex-1 flex flex-col">
             {!isLoginPage && (
                <header className="p-4 border-b flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                      <SidebarTrigger className="md:hidden" />
                      <h1 className="text-xl font-semibold">Admin Panel</h1>
                  </div>
                  <Notifications />
                </header>
              )}
              <main className={`flex-1 ${!isLoginPage ? 'p-8 bg-muted/40' : ''}`}>
                {children}
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
    </ProtectedRoute>
  );
}
