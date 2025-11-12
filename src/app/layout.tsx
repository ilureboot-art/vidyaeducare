
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
  const isPublicPage = isAuthPage || pathname === '/' || pathname === '/how-to-play';

  useEffect(() => {
    if (loading) {
      return; // Wait for the auth state to be confirmed
    }

    // Redirect logic
    if (user && isAuthPage) {
      // Logged-in user trying to access login/signup page
      router.push('/profile');
    } else if (!user && !isPublicPage && !isAdminPage) {
      // Logged-out user trying to access a protected page
      router.push('/login');
    }
  }, [user, loading, isAuthPage, isPublicPage, isAdminPage, router, pathname]);

  // Admin section has its own layout
  if (isAdminPage) {
    return <>{children}</>;
  }
  
  // While loading, if the page is not public, show a loader. Public pages render immediately.
  if (loading && !isPublicPage) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      );
  }

  // If user is authenticated, show the full app layout
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
  
  // For unauthenticated users, show public pages without the full app layout
  if (!user && isPublicPage) {
    if (isAuthPage || pathname === '/') {
        // Centered layout for auth pages and homepage
        return <main className="flex-1 flex flex-col w-full items-center justify-center p-4">{children}</main>;
    }
    // Standard layout for other public pages like /how-to-play
    return <main className="flex-1 flex flex-col w-full p-4 items-center">{children}</main>;
  }

  // Fallback loader for any edge cases (e.g., redirecting a logged-out user)
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
