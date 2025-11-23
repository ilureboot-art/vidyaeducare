
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppHeader } from '@/components/AppHeader';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ChatWidget } from '@/components/ChatWidget';
import { ThemeProvider } from "next-themes";
import { FirebaseClientProvider, useAuth } from '@/context/FirebaseClientProvider';
import { Loader2 } from 'lucide-react';
import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Notifications } from "@/components/admin/Notifications";
import { ReactNode } from 'react';

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


function AuthGuard({ children }: { children: ReactNode }) {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-background">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return <>{children}</>;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/admin/login';

  const bodyClassName = `font-body antialiased`;
  const loadingFallback = (
    <div className="flex justify-center items-center h-screen bg-background">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />
        <title>Vidya EduCare</title>
        <meta name="description" content="The ultimate platform combining academic excellence with rewarding opportunities to make learning impactful." />
      </head>
      <body className={bodyClassName}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {isAuthPage ? (
                <div className="flex items-center justify-center min-h-screen bg-muted/40">
                    <FirebaseClientProvider loadingFallback={loadingFallback}>
                        {children}
                    </FirebaseClientProvider>
                </div>
            ) : (
                <FirebaseClientProvider loadingFallback={loadingFallback}>
                    <AuthGuard>
                        {isAdminPage ? (
                            <AdminLayout>{children}</AdminLayout>
                        ) : (
                            <UserLayout>{children}</UserLayout>
                        )}
                        <Toaster />
                    </AuthGuard>
                </FirebaseClientProvider>
            )}
        </ThemeProvider>
      </body>
    </html>
  );
}
