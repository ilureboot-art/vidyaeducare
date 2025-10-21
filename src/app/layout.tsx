
"use client";

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppHeader } from '@/components/AppHeader';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ChatWidget } from '@/components/ChatWidget';
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from 'react';
import { DataProvider } from '@/hooks/use-hydrate-data.tsx';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // In a real app, this would be a check against a token or session.
    // For this prototype, we'll consider any non-auth/public page as "authenticated".
    const publicPages = ['/', '/login', '/signup', '/forgot-password', '/admin/login', '/how-to-play'];
    const isAdminPage = pathname.startsWith('/admin');
    
    setIsAuthenticated(!publicPages.includes(pathname) && !isAdminPage);

  }, [pathname]);

  const isAdminPage = pathname.startsWith('/admin');
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/forgot-password') || pathname.startsWith('/admin/login');
  const isPublicPage = ['/', '/how-to-play'].includes(pathname);

  const bodyClassName = `font-body antialiased ${isAdminPage ? '' : 'flex flex-col min-h-screen'}`;
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />
        <title>Vidya EduCare</title>
      </head>
      <body className={bodyClassName}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          <DataProvider>
            {isAdminPage && !isAuthPage ? (
              <>{children}</>
            ) : (isAuthPage || pathname === '/' || pathname === '/how-to-play') ? (
              <main className="flex-1 flex flex-col w-full">{children}</main>
            ) : (
              <>
                <AppHeader />
                <main className="flex-1 flex flex-col items-center w-full p-4 pb-24 pt-20">
                  {children}
                </main>
                <Navbar />
                <ChatWidget />
              </>
            )}
            <Toaster />
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
