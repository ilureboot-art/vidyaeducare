import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'GuessMaster',
  description: 'Guess the number and win big!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <main className="min-h-screen bg-background flex flex-col items-center p-4 pb-24 md:pb-24">
          {children}
        </main>
        <Navbar />
        <Toaster />
      </body>
    </html>
  );
}
