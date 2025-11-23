
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Menu, BookOpen, Trophy, Store, Users, Wallet, Settings, ChevronRight, X, LogOut, User, History, BrainCircuit, Zap, Gamepad2, ShieldCheck, LayoutDashboard, Share2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { UserNotifications } from "@/components/UserNotifications";
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
                               <h2 className="text-lg font-bold text-primary">Vidya EduCare Menu</h2>
                            </SheetTitle>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                <X/>
                            </Button>
                        </div>
                        <SheetDescription asChild>
                            <div className="flex items-center gap-3 pt-4">
                                <User className="w-5 h-5" />
                                <span className="font-medium">{user?.email || "User"}</span>
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
                    </ScrollArea>
                    <div className="p-4 mt-auto border-t">
                         <button
                            onClick={handleSignOut}
                            className="flex items-center justify-between p-3 text-sm font-medium rounded-lg hover:bg-muted w-full"
                        >
                            <div className="flex items-center gap-4">
                                <LogOut className="w-5 h-5 text-destructive" />
                                <span>Sign Out</span>
                            </div>
                        </button>
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
