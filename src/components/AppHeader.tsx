
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Trophy, Users, Wallet, Settings, ChevronRight, X, LogOut, User, History, Zap, ShieldCheck, Share2, LogIn, UserPlus } from "lucide-react";
import { UserNotifications } from "@/components/UserNotifications";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlobalSearch } from "@/components/GlobalSearch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth, useAuthService } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

const navItems = [
    { href: "/profile", label: "My Students", icon: Users },
    { href: "/refer", label: "Refer & Earn", icon: Share2 },
    { href: "/iba/dashboard", label: "IBA Dashboard", icon: ShieldCheck },
    { href: "/referbolt", label: "ReferBolt", icon: Zap },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/wallet", label: "Wallet", icon: Wallet },
    { href: "/transactions", label: "Transactions", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
];

export function AppHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const auth = useAuthService();
  const router = useRouter();

  const handleSignOut = async () => {
      if (!auth) return;
      await signOut(auth);
      setIsOpen(false);
      router.push('/login');
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-4">
                {user ? (
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Open Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72 p-0 flex flex-col">
                            <SheetHeader className="p-4 border-b">
                                <div className="flex justify-between items-center">
                                    <SheetTitle asChild>
                                    <h2 className="text-lg font-bold text-primary italic uppercase tracking-tighter">Vidya EduCare</h2>
                                    </SheetTitle>
                                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                        <X/>
                                    </Button>
                                </div>
                                <SheetDescription asChild>
                                    <div className="flex items-center gap-3 pt-4 overflow-hidden">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {user.email?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium truncate text-xs">{user.email}</span>
                                    </div>
                                </SheetDescription>
                            </SheetHeader>
                            <ScrollArea className="flex-1">
                                <nav className="p-4">
                                    <ul className="space-y-1">
                                        {navItems.map((item, index) => {
                                            const Icon = item.icon;
                                            return (
                                            <li key={`${item.href}-${index}`}>
                                                <Link
                                                    href={item.href}
                                                    onClick={() => setIsOpen(false)}
                                                    className="flex items-center justify-between p-3 text-sm font-bold rounded-xl hover:bg-primary/5 hover:text-primary transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Icon className="w-4 h-4" />
                                                        <span>{item.label}</span>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 opacity-30" />
                                                </Link>
                                            </li>
                                            );
                                        })}
                                    </ul>
                                </nav>
                            </ScrollArea>
                            <div className="p-4 mt-auto border-t bg-muted/20">
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center justify-between p-3 text-sm font-black rounded-xl hover:bg-destructive/5 text-destructive w-full transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <LogOut className="w-5 h-5" />
                                        <span>SIGN OUT</span>
                                    </div>
                                </button>
                            </div>
                        </SheetContent>
                    </Sheet>
                ) : (
                    <Button variant="ghost" size="icon" asChild className="md:hidden">
                        <Link href="/"><Menu className="h-6 w-6" /></Link>
                    </Button>
                )}
                <Link href="/" className="text-xl md:text-2xl font-black text-primary tracking-tighter italic uppercase">
                    Vidya <span className="text-accent">EduCare</span>
                </Link>
            </div>

            <div className="flex items-center gap-2">
                <GlobalSearch />
                <ThemeToggle />
                {user ? (
                    <UserNotifications />
                ) : (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild className="hidden sm:flex font-bold">
                            <Link href="/login">Login</Link>
                        </Button>
                        <Button size="sm" asChild className="font-black px-4 bg-primary shadow-md">
                            <Link href="/signup">JOIN FREE</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    </header>
  );
}
