
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { Navbar } from '@/components/Navbar';
import { ChatWidget } from '@/components/ChatWidget';
import { AppHeader } from '@/components/AppHeader';
import ProtectedRoute from '@/components/ProtectedRoute';
import { FirebaseProvider } from '@/firebase/provider';
import { AdminSidebar } from '@/components/AdminSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Notifications } from "@/components/admin/Notifications";

const bodyClassName = `font-body antialiased`;

function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
        {children}
    </div>
  );
}

function UserLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  return (
      <div className="flex flex-col min-h-screen">
          {!isHomePage && <AppHeader />}
          <main className={`flex-1 flex flex-col w-full items-center ${isHomePage ? '' : 'p-4 pb-24 pt-20'}`}>
            <ProtectedRoute>{children}</ProtectedRoute>
          </main>
          <>
            {!isHomePage && <Navbar />}
            <ChatWidget />
          </>
      </div>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  const isAdminLoginPage = pathname === '/admin/login';
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/admin/setup', '/check-head-admin'].includes(pathname);

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
          <FirebaseProvider>
              {isAuthPage || isAdminLoginPage ? (
                <AuthLayout>{children}</AuthLayout>
              ) : isAdminPage ? (
                // The admin layout itself is now protected inside src/app/admin/layout.tsx
                children
              ) : (
                <UserLayout>{children}</UserLayout>
              )}
          </FirebaseProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
