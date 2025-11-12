
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
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password';
  const isPublicPage = isAuthPage || pathname === '/' || pathname === '/how-to-play';

  useEffect(() => {
    if (loading) return; // Wait for the auth state to be confirmed

    if (user && isAuthPage) {
      // Logged-in user trying to access login/signup, redirect to a default authenticated page
      router.push('/profile');
    } else if (!user && !isPublicPage && !isAdminPage) {
      // Logged-out user trying to access a protected page
      router.push('/login');
    }
  }, [user, loading, isAuthPage, isPublicPage, isAdminPage, router, pathname]);

  // Admin section has its own specific layout, handle it separately.
  if (isAdminPage) {
    return <>{children}</>;
  }

  // For public pages, render them immediately if auth state is still loading or if there's no user.
  // This ensures fast initial load for new visitors.
  if (isPublicPage) {
     if (user) {
        // If user is logged in, show the full app layout
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
     // For logged-out users on public pages, show a simpler layout
     return <main className="flex-1 flex flex-col w-full items-center justify-center p-4">{children}</main>;
  }
  
  // For protected routes, show a loading spinner until auth state is confirmed.
  if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      );
  }

  // If loading is complete and we have a user on a protected page, show the full app layout.
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

  // Fallback for any edge cases (e.g., redirecting a logged-out user)
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
