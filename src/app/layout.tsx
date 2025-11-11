
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
    // This effect now runs *after* the initial auth state is confirmed (loading is false)
    if (!loading) {
      if (user && isAuthPage) {
        // If a logged-in user tries to visit login/signup, redirect them.
        router.push('/profile');
      } else if (!user && !isPublicPage) {
        // If a non-logged-in user tries to visit a protected page, redirect them.
        router.push('/login');
      }
    }
  }, [user, loading, isAuthPage, isPublicPage, router, pathname]);

  // The main AuthProvider handles the initial global loading state.
  // We can show another loader here while the router effect is processing the redirect.
  if (loading || (!user && !isPublicPage)) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    );
  }

  if (isAdminPage) {
    return <>{children}</>;
  }
  
  // Public pages that can be seen by non-logged in users
  if (!user && isPublicPage) {
      if (isAuthPage || pathname === '/') {
        return <main className="flex-1 flex flex-col w-full items-center justify-center">{children}</main>;
      }
      // For other public pages like /how-to-play
      return <main className="flex-1 flex flex-col w-full p-4 items-center">{children}</main>;
  }

  // If there's a user, show the full app layout for authenticated pages
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
  
  // This should theoretically not be reached due to the redirect logic, but serves as a final fallback.
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
