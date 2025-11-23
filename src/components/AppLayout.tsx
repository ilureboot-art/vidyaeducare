
"use client";

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Notifications } from "@/components/admin/Notifications";
import { AppHeader } from '@/components/AppHeader';
import { Navbar } from '@/components/Navbar';
import { ChatWidget } from '@/components/ChatWidget';
import { AuthGuard } from '@/components/AuthGuard';

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
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    return (
        <div className="flex flex-col min-h-screen">
            {!isHomePage && <AppHeader />}
            <main className={`flex-1 flex flex-col w-full items-center ${isHomePage ? '' : 'p-4 pb-24 pt-20'}`}>
              {children}
            </main>
            <>
              {!isHomePage && <Navbar />}
              <ChatWidget />
            </>
        </div>
    );
}

function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            {children}
        </div>
    );
}

export function AppLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isAdminPage = pathname.startsWith('/admin');
    const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/admin/login';
    const isPublicPage = pathname === '/';

    if (isAuthPage) {
        return <AuthLayout>{children}</AuthLayout>;
    }
    
    if (isAdminPage) {
        return (
            <AuthGuard adminOnly>
                <AdminLayout>{children}</AdminLayout>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard isPublic={isPublicPage}>
            <UserLayout>{children}</UserLayout>
        </AuthGuard>
    );
}
