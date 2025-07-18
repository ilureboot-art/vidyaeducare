
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Menu, BookOpen, Trophy, Store, Users, Wallet, Settings, ChevronRight, X, LogOut, User, History, BrainCircuit, Zap, Gamepad2, ShieldCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { UserNotifications } from "@/components/UserNotifications";

const navItems = [
    { href: "/mock-test", label: "Mock Test", icon: BookOpen },
    { href: "/play", label: "Play Game", icon: Gamepad2 },
    { href: "/vidya-edurank", label: "Vidya Edurank", icon: BrainCircuit },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/store", label: "Store", icon: Store },
    { href: "/refer", label: "IBA Panel", icon: ShieldCheck },
    { href: "/referbolt", label: "ReferBolt", icon: Zap },
    { href: "/wallet", label: "Wallet", icon: Wallet },
    { href: "/profile", label: "My Students", icon: Users },
    { href: "/transactions", label: "Transactions", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
];

export function AppHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
             <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-60 p-0 flex flex-col">
                    <SheetHeader className="p-4">
                         <div className="flex justify-between items-center">
                            <SheetTitle asChild>
                               <h2 className="text-xl font-bold text-primary">Menu</h2>
                            </SheetTitle>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                <X/>
                            </Button>
                        </div>
                        <SheetDescription className="sr-only">Main navigation menu for the application.</SheetDescription>
                    </SheetHeader>
                    <div className="p-4 pt-0 flex-1 flex flex-col">
                        <Separator />
                        <nav className="mt-6 flex-1">
                            <ul className="space-y-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center justify-between p-2 text-sm font-medium rounded-lg hover:bg-muted"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className="w-5 h-5 text-primary" />
                                                <span>{item.label}</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        </Link>
                                    </li>
                                    );
                                })}
                            </ul>
                        </nav>
                        <Separator />
                        <div className="mt-4">
                             <Link
                                href="/login"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-between p-3 text-sm font-medium rounded-lg hover:bg-muted"
                            >
                                <div className="flex items-center gap-4">
                                    <LogOut className="w-5 h-5 text-destructive" />
                                    <span>Sign Out</span>
                                </div>
                            </Link>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
            <Link href="/" className="text-2xl font-bold text-primary tracking-tighter">
                Vidya EduCare
            </Link>
             <UserNotifications />
        </div>
    </header>
  );
}
