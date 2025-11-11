
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppHeader } from '@/components/AppHeader';
import { usePathname, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ChatWidget } from '@/components/ChatWidget';
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const isAdminPage = pathname.startsWith('/admin');
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/forgot-password');
  const isPublicPage = isAuthPage || pathname === '/' || pathname === '/how-to-play' || pathname.startsWith('/admin/login');

  useEffect(() => {
    if (!loading) {
      if (user && isAuthPage) {
        router.push('/profile');
      } else if (!user && !isPublicPage) {
        router.push('/login');
      }
    }
  }, [user, loading, isAuthPage, isPublicPage, router]);


  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    );
  }

  if (isAdminPage) {
    return <>{children}</>;
  }
  
  // If we are on a public page and there's no user, show the page without the main layout
  if (!user && isPublicPage) {
      if (isAuthPage || pathname === '/') {
        return <main className="flex-1 flex flex-col w-full items-center justify-center">{children}</main>;
      }
      return <main className="flex-1 flex flex-col w-full p-4 items-center">{children}</main>;
  }

  // If there's a user and we are not on a special page, show the full app layout
  if (user) {
    return (
        <div className='flex flex-col min-h-screen'>
            <AppHeader />
            <main className="flex-1 flex flex-col w-full p-4 pb-24 pt-20 items-center">
                {children}
            </main>
            <Navbar />
            <ChatWidget />
        </div>
    );
  }

  // Fallback for unauthenticated users on non-public pages (will be redirected by useEffect)
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
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
