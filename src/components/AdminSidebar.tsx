
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
    LayoutDashboard, 
    Users, 
    Gamepad2, 
    Settings,
    CreditCard,
    Shield,
    LogOut,
    LifeBuoy,
    Zap,
    BarChart3,
    Server,
    MessageSquare,
    ShoppingCart
} from "lucide-react";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/transactions", label: "Transactions", icon: CreditCard },
  { href: "/admin/game-settings", label: "Game Settings", icon: Gamepad2 },
  { href: "/admin/store-settings", label: "Store Settings", icon: ShoppingCart },
  { href: "/admin/referbolt", label: "ReferBolt Mgt.", icon: Zap },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/system-status", label: "System Status", icon: Server },
  { href: "/admin/chat", label: "Chat Management", icon: MessageSquare },
  { href: "/admin/security", label: "Security", icon: Shield },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex flex-col w-64 bg-background border-r">
        <div className="flex items-center justify-center h-16 border-b">
            <Link href="/admin" className="flex items-center gap-2 font-bold text-primary">
                <Shield className="w-6 h-6" />
                <span>GuessMaster Admin</span>
            </Link>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
            {adminNavItems.map((item) => {
                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin");
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                            isActive && "bg-muted text-primary"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
        <div className="mt-auto p-4 border-t">
            <Link 
                href="/" 
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
                <LogOut className="h-4 w-4" />
                Exit Admin
            </Link>
        </div>
    </div>
  );
}
