
"use client";

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from '@/components/Navbar';
import { AppHeader } from '@/components/AppHeader';
import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />
        <title>GuessMaster</title>
      </head>
      <body className="font-body antialiased">
        {!isAdminPage && <AppHeader />}
        <main className={`min-h-screen bg-background flex flex-col items-center p-4 pb-24 ${!isAdminPage && 'pt-20'}`}>
          {children}
        </main>
        {!isAdminPage && <Navbar />}
        <Toaster />
      </body>
    </html>
  );
}
