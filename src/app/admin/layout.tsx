
"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { usePathname } from 'next/navigation';
import { Notifications } from "@/components/admin/Notifications";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/40">
        {children}
      </div>
    );
  }

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
