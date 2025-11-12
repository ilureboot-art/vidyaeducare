
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
    // This effect now runs *after* the initial auth state is confirmed (loading is false)
    if (!loading) {
      if (user && isAuthPage) {
        // If a logged-in user tries to visit login/signup, redirect them.
        router.push('/profile');
      } else if (!user && !isPublicPage && !isAdminPage) {
        // If a non-logged-in user tries to visit a protected page, redirect them.
        router.push('/login');
      }
    }
  }, [user, loading, isAuthPage, isPublicPage, isAdminPage, router, pathname]);
  
  // Admin pages have their own layout, so we can just render them.
  if (isAdminPage) {
    return <>{children}</>;
  }

  // Show a full-page loader only when the auth state is loading AND it's not a public page
  // This allows public pages to render instantly.
  if (loading && !isPublicPage) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    );
  }
  
  // Public pages (for unauthenticated users)
  if (!user && isPublicPage) {
      // The login/signup pages have a centered layout
      if (isAuthPage || pathname === '/') {
        return <main className="flex-1 flex flex-col w-full items-center justify-center p-4">{children}</main>;
      }
      // Other public pages like /how-to-play get a standard top-aligned layout
      return <main className="flex-1 flex flex-col w-full p-4 items-center">{children}</main>;
  }

  // Authenticated user layout
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
  
  // This state is reached for non-logged-in users on non-public pages, just before the redirect effect kicks in.
  // Showing a loader here prevents a flash of unstyled/empty content.
  if (!user && !isPublicPage) {
       return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    );
  }
  
  // Fallback for any other state (like public pages during initial load)
  return <>{children}</>;
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
