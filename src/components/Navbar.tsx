
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, Users, Wallet, BrainCircuit, Zap, Puzzle, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/firebase";

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
  const { user } = useAuth();
  
  // Only show bottom navbar for authenticated regular users
  // Hide in admin, hide in live tests, hide for guests
  if (!user || pathname.startsWith('/admin') || pathname.startsWith('/mock-test') || pathname.startsWith('/quiz-clash/play') || pathname.startsWith('/trial-mock-test')) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2 z-50 shadow-[0_-5px_15px_-3px_rgba(0,0,0,0.05)]">
         <nav className="container mx-auto grid grid-cols-6 gap-1 max-w-lg">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-14 rounded-xl text-xs font-medium transition-all hover:bg-primary/5",
                            isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
                        )}
                    >
                        <Icon className={cn("h-5 w-5 mb-1 transition-transform", isActive && "scale-110")} />
                        <span className="text-center text-[9px] leading-tight font-black uppercase tracking-tighter">{item.label}</span>
                    </Link>
                )
            })}
         </nav>
    </div>
  );
}
