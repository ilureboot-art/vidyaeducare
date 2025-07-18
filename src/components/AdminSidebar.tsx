
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, 
    Users, 
    Gamepad2, 
    CreditCard,
    Shield,
    LogOut,
    LifeBuoy,
    Zap,
    BarChart3,
    Server,
    MessageSquare,
    ShoppingCart,
    Landmark,
    Home,
    UserCog,
    Bell,
    FileQuestion,
    BrainCircuit
} from "lucide-react";
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
} from "@/components/ui/sidebar";


const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/transactions", label: "Transactions", icon: CreditCard },
  { href: "/admin/chat", label: "Chat Management", icon: MessageSquare },
  { href: "/admin/question-bank", label: "Question Bank", icon: FileQuestion },
  { href: "/admin/ai-agent", label: "Vidya EduCare AI Agent", icon: BrainCircuit },
  { href: "/admin/game-settings", label: "Game Settings", icon: Gamepad2 },
  { href: "/admin/store-settings", label: "Store Settings", icon: ShoppingCart },
  { href: "/admin/payment-settings", label: "Payment Settings", icon: Landmark },
  { href: "/admin/referbolt", label: "ReferBolt Mgt.", icon: Zap },
  { href: "/admin/system-status", label: "System Status", icon: Server },
  { href: "/admin/admin-management", label: "Admin Management", icon: UserCog },
  { href: "/admin/security", label: "Security", icon: Shield },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
        <SidebarHeader>
            <Link href="/admin" className="flex items-center gap-2 font-bold text-primary text-lg">
                <Shield className="w-6 h-6" />
                <span className="group-data-[collapsible=icon]:hidden">GuessMaster</span>
            </Link>
        </SidebarHeader>
        <SidebarContent>
            <SidebarMenu>
                {adminNavItems.map((item) => {
                    const isActive = item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href);
                    return (
                        <SidebarMenuItem key={item.href}>
                            <Link href={item.href}>
                                <SidebarMenuButton tooltip={item.label} isActive={isActive}>
                                    <item.icon/>
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu>
                 <SidebarMenuItem>
                    <Link href="/">
                        <SidebarMenuButton tooltip="Exit Admin">
                                <Home />
                                <span>Back to App</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <Link href="/login">
                        <SidebarMenuButton tooltip="Sign Out">
                                <LogOut />
                                <span>Sign Out</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
    </Sidebar>
  );
}
