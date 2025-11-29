
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ChatWidget } from '@/components/ChatWidget';
import { AppHeader } from '@/components/AppHeader';
import { Loader2 } from 'lucide-react';
import { FirebaseProvider, useAuth } from '@/firebase/provider';
import AdminLayout from './admin/layout';

// Force the client-side firebase client to be loaded and initialized.
import { app } from '@/firebase/client';

const bodyClassName = `font-body antialiased`;

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
        {children}
    </div>
  );
}

function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

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


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  const isAdminAuthPage = ['/admin/login', '/admin/setup', '/check-head-admin'].includes(pathname);
  const isUserAuthPage = ['/login', '/signup', '/forgot-password'].includes(pathname);
  const isAuthPage = isUserAuthPage || isAdminAuthPage;
  const isPublicPage = pathname === '/' || pathname === '/how-to-play';

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
              {isAuthPage || isAdminPage ? (
                <>
                  {isAdminPage ? <AdminLayout>{children}</AdminLayout> : <AuthLayout>{children}</AuthLayout>}
                </>
              ) : isPublicPage ? (
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
