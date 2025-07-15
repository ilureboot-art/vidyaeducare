"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, Trophy, HelpCircle, Store, Zap, Wallet, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Play", icon: Gamepad2 },
  { href: "/how-to-play", label: "How to Play", icon: HelpCircle },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/store", label: "Store", icon: Store },
  { href: "/referbolt", label: "ReferBolt", icon: Zap },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Gamepad2 className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">GuessMaster</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === item.href ? "text-foreground" : "text-foreground/60"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Mobile Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 p-2">
             <nav className="flex justify-around">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-16 h-14 rounded-md text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                            )}
                        >
                            <Icon className="h-5 w-5 mb-1" />
                            <span className="text-center text-[10px] leading-tight">{item.label}</span>
                        </Link>
                    )
                })}
             </nav>
        </div>

      </div>
    </header>
  );
}
