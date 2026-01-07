"use client";

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { ChatWidget } from '@/components/ChatWidget';
import { AppHeader } from '@/components/AppHeader';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 flex flex-col w-full items-center p-4 pb-24 pt-20">
          {children}
        </main>
        <>
          <Navbar />
          <ChatWidget />
        </>
    </div>
  );
}
