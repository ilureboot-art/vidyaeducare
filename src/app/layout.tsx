
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppHeader } from '@/components/AppHeader';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ChatWidget } from '@/components/ChatWidget';
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  const isAdminPage = pathname.startsWith('/admin');
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/forgot-password') || pathname.startsWith('/admin/login');
  const isPublicPage = isAuthPage || pathname === '/' || pathname === '/how-to-play';

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    );
  }

  if (isAdminPage) {
    if (pathname === '/admin/login') {
      return (
        <main className="flex-1 flex flex-col w-full p-4 items-center justify-center min-h-screen bg-muted/40">
          {children}
        </main>
      );
    }
    // This assumes an admin is logged in. We can add admin-specific auth later.
    return <>{children}</>;
  }
  
  if (!user && !isPublicPage) {
     // Redirecting is better handled by middleware in Next.js, 
     // but for this component-based approach, we'll just show a loading state
     // or a redirect message. A simple null will prevent flicker.
    return null;
  }
  
  const showMainLayout = user && !isPublicPage;

  return (
      <div className='flex flex-col min-h-screen'>
        {showMainLayout && <AppHeader />}
        <main className={`flex-1 flex flex-col w-full p-4 ${showMainLayout ? 'pb-24 pt-20 items-center' : ''}`}>
          {children}
        </main>
        {showMainLayout && <Navbar />}
        {showMainLayout && <ChatWidget />}
      </div>
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
      </head>
      <body className={bodyClassName}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          <AuthProvider>
            <AppLayout>{children}</AppLayout>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
