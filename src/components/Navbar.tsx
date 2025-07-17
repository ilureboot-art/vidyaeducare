
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, Store, Gift, Wallet, Home, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/play", label: "Play", icon: Gamepad2 },
  { href: "/refer", label: "Refer", icon: Gift },
  { href: "/vidya-edurank", label: "Vidya", icon: BrainCircuit },
  { href: "/store", label: "Store", icon: Store },
  { href: "/wallet", label: "Wallet", icon: Wallet },
];

export function Navbar() {
  const pathname = usePathname();
  
  if (pathname.startsWith('/admin')) {
    return null; // Don't render the main navbar in the admin section
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2 z-50">
         <nav className="flex justify-around">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === '/' ? pathname === item.href : pathname.startsWith(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center w-16 h-14 rounded-md text-xs font-medium transition-colors hover:bg-primary/10 hover:text-primary",
                            isActive ? "text-primary" : "text-muted-foreground"
                        )}
                    >
                        <Icon className="h-6 w-6 mb-1" />
                        <span className="text-center text-[10px] leading-tight">{item.label}</span>
                    </Link>
                )
            })}
         </nav>
    </div>
  );
}
