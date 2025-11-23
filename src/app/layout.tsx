
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
import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Notifications } from "@/components/admin/Notifications";
import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { Admin } from '@/lib/admin-data';
import { useFirebase } from '@/context/FirebaseClientProvider';
import { AuthContext } from '@/context/AuthContext';


// This is the new home for the Auth logic.
// It allows us to conditionally load and check auth state, which is much more performant.
function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { auth, db } = useFirebase();

  const isAdminPage = pathname.startsWith('/admin');
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/admin/login';

  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHeadAdmin, setIsHeadAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      if (!isAuthPage) {
        setLoading(true);
      } else {
        setLoading(false);
      }
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const adminDocRef = doc(db, "admins", user.uid);
        const adminDocSnap = await getDoc(adminDocRef);
        if (adminDocSnap.exists() && adminDocSnap.data().status === 'Active') {
          const adminData = adminDocSnap.data() as Admin;
          setIsAdmin(true);
          setIsHeadAdmin(adminData.role === 'Head Admin');
        } else {
          setIsAdmin(false);
          setIsHeadAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsHeadAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db, isAuthPage, pathname]);

  const authContextValue = { user, loading, isAdmin, isHeadAdmin };
  
  if (isAuthPage) {
    return (
      <AuthContext.Provider value={authContextValue}>
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
          {children}
        </div>
      </AuthContext.Provider>
    );
  }

  const loadingFallback = (
    <div className="flex justify-center items-center h-screen bg-background">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
      <AuthContext.Provider value={authContextValue}>
        {isAdminPage ? (
          <SidebarProvider>
            <div className="flex min-h-screen">
                <AdminSidebar />
                <SidebarInset className="flex-1 flex flex-col">
                    <header className="p-4 border-b flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                        <SidebarTrigger className="md:hidden" />
                        <h1 className="text-xl font-semibold">Admin Panel</h1>
                        </div>
                        <Notifications />
                    </header>
                    <main className="flex-1 p-8 bg-muted/40">
                        {children}
                    </main>
                </SidebarInset>
            </div>
          </SidebarProvider>
        ) : (
          <div className="flex flex-col min-h-screen">
            <AppHeader />
            <main className='flex-1 flex flex-col w-full items-center p-4 pb-24 pt-20'>
              {children}
            </main>
            <>
              <Navbar />
              <ChatWidget />
            </>
          </div>
        )}
        <Toaster />
      </AuthContext.Provider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const bodyClassName = `font-body antialiased`;
  const loadingFallback = (
    <div className="flex justify-center items-center h-screen bg-background">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );
  
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
          <FirebaseClientProvider loadingFallback={loadingFallback}>
            <AppLayout>{children}</AppLayout>
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

    