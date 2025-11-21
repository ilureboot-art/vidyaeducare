
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppHeader } from '@/components/AppHeader';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ChatWidget } from '@/components/ChatWidget';
import { ThemeProvider } from "next-themes";
import { FirebaseClientProvider } from '@/context/FirebaseClientProvider';
import { Loader2 } from 'lucide-react';

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password';

  return (
    <>
      {!isAdminPage && !isAuthPage && <AppHeader />}
      <main className={`flex-1 flex flex-col w-full items-center ${!isAdminPage && !isAuthPage ? 'p-4 pb-24 pt-20' : ''} ${isAuthPage ? 'justify-center min-h-screen' : ''}`}>
        {children}
      </main>
      {!isAdminPage && !isAuthPage && (
        <>
          <Navbar />
          <ChatWidget />
        </>
      )}
      <Toaster />
    </>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const bodyClassName = `font-body antialiased`;
  
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
          <FirebaseClientProvider
             loadingFallback={
              <div className="flex justify-center items-center h-screen bg-background">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            }
          >
            <AppContent>{children}</AppContent>
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
