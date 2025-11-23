
"use client";

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { FirebaseClientProvider } from '@/context/FirebaseClientProvider';
import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Notifications } from "@/components/admin/Notifications";
import { AppHeader } from '@/components/AppHeader';
import { Navbar } from '@/components/Navbar';
import { ChatWidget } from '@/components/ChatWidget';
import ProtectedRoute from './ProtectedRoute';

function AdminLayout({ children }: { children: React.ReactNode }) {
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

function UserLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen">
            <AppHeader />
            <main className='flex-1 flex flex-col w-full items-center p-4 pb-24 pt-20'>
              {children}
            </main>
            <>
              <Navbar />
              <ChatWidget />
            </>
        </div>
    );
}

export function AppLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isAdminPage = pathname.startsWith('/admin');
    const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/admin/login';
    const loadingFallback = (
      <div className="flex justify-center items-center h-screen bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );

    if (isAuthPage) {
        return (
            <FirebaseClientProvider loadingFallback={loadingFallback}>
                <div className="flex items-center justify-center min-h-screen bg-muted/40">
                    {children}
                </div>
            </FirebaseClientProvider>
        );
    }
    
    if (isAdminPage) {
        return (
            <FirebaseClientProvider loadingFallback={loadingFallback}>
                <ProtectedRoute>
                    <AdminLayout>{children}</AdminLayout>
                </ProtectedRoute>
            </FirebaseClientProvider>
        );
    }

    return (
        <FirebaseClientProvider loadingFallback={loadingFallback}>
            <ProtectedRoute>
                <UserLayout>{children}</UserLayout>
            </ProtectedRoute>
        </FirebaseClientProvider>
    );
}
