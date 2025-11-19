
"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { usePathname } from 'next/navigation';
import { Notifications } from "@/components/admin/Notifications";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useFirebase } from "@/context/FirebaseClientProvider";
import { Loader2 } from "lucide-react";

function AdminLayoutContent({ children }: { children: React.ReactNode; }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const { loading } = useFirebase();

  // Master loading gate for the entire admin section.
  // This ensures no admin page, including login, renders before Firebase is ready.
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-muted/40">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }
  
  // If it's the login page, show it standalone without the sidebar/header.
  if (isLoginPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/40">
        {children}
      </div>
    );
  }

  // For all other admin pages, use the protected route and full layout.
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
    // The FirebaseClientProvider in the root layout handles the actual auth state and service loading.
    // We just consume its `loading` state in AdminLayoutContent.
    return (
        <AdminLayoutContent>{children}</AdminLayoutContent>
    );
}
