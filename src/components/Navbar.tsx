"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Store, Users, Wallet, Home, BrainCircuit, Gamepad2, Zap, ShieldCheck, LayoutDashboard, User, Trophy, Puzzle, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/profile", label: "Students", icon: Users },
  { href: "/ai-tutor", label: "AI Tutor", icon: BrainCircuit },
  { href: "/ai-notes", label: "AI Notes", icon: ScrollText },
  { href: "/quiz-clash", label: "Quiz Clash", icon: Puzzle },
  { href: "/store", label: "Store", icon: Store },
  { href: "/wallet", label: "Wallet", icon: Wallet },
];

export function Navbar() {
  const pathname = usePathname();
  
  if (pathname.startsWith('/admin') || pathname.startsWith('/mock-test') || pathname.startsWith('/quiz-clash/play')) {
    return null; // Don't render the main navbar in the admin section or during a game/test
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2 z-50">
         <nav className="grid grid-cols-6 gap-1">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-14 rounded-md text-xs font-medium transition-colors hover:bg-primary/10 hover:text-primary",
                            isActive ? "text-primary" : "text-muted-foreground"
                        )}
                    >
                        <Icon className="h-5 w-5 mb-1" />
                        <span className="text-center text-[9px] leading-tight font-bold">{item.label}</span>
                    </Link>
                )
            })}
         </nav>
    </div>
  );
}
