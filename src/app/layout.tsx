
"use client";

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppHeader } from '@/components/AppHeader';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/forgot-password');

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />
        <title>GuessMaster</title>
      </head>
      <body className={`font-body antialiased ${isAdminPage ? '' : 'flex flex-col min-h-screen'}`}>
        {isAdminPage ? (
            <>
                {children}
            </>
        ) : (
            <>
                {!isAuthPage && <AppHeader />}
                <main className={`min-h-screen bg-background flex flex-col items-center p-4 pb-24 ${!isAuthPage ? 'pt-20' : ''}`}>
                    {children}
                </main>
                {!isAuthPage && <Navbar />}
            </>
        )}
        <Toaster />
      </body>
    </html>
  );
}
