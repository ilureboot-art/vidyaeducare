
"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { usePathname } from 'next/navigation';
import { Notifications } from "@/components/admin/Notifications";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

function AdminLayoutContent({ children }: { children: React.ReactNode; }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  
  // If it's the login page, show it standalone
  if (isLoginPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/40">
        {children}
      </div>
    );
  }

  return (
    <ProtectedRoute>
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


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    // AuthProvider is already in the root layout, no need to wrap again.
    // The check for which layout to show is handled in AdminLayoutContent.
    return (
        <AdminLayoutContent>{children}</AdminLayoutContent>
    );
}

    