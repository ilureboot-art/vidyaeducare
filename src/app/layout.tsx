
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { ChatWidget } from '@/components/ChatWidget';
import { AppHeader } from '@/components/AppHeader';
import { Loader2 } from 'lucide-react';
import AdminLayout from './admin/layout';
import { FirebaseClientProvider, useAuth } from '@/firebase/client-provider';

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
 
  if (loading) {
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

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isAdminPage = pathname.startsWith('/admin');
  const isAdminAuthPage = ['/admin/login', '/admin/setup', '/check-head-admin'].includes(pathname);
  const isUserAuthPage = ['/login', '/signup', '/forgot-password'].includes(pathname);
  const isAuthPage = isUserAuthPage || isAdminAuthPage;
  const isPublicPage = pathname === '/' || pathname === '/how-to-play';

  if (isAuthPage) {
    return <AuthLayout>{children}</AuthLayout>;
  }
  if (isAdminPage) {
    return <AdminLayout>{children}</AdminLayout>;
  }
  if (isPublicPage) {
    return <>{children}</>;
  }
  return <UserLayout>{children}</UserLayout>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);


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
          <FirebaseClientProvider>
             {isClient ? <AppContent>{children}</AppContent> : (
                <div className="flex justify-center items-center h-screen">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
             )}
          </FirebaseClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
