
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, 
    Users, 
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
    UserCog,
    Bell,
    BookCopy,
    Calendar,
    Puzzle,
    Trophy
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
import { useAuthService } from "@/firebase";
import { signOut } from "firebase/auth";

const adminNavItems = [
  { href: "/admin/analytics", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/transactions", label: "Transactions", icon: CreditCard },
  { href: "/admin/chat", label: "Support Chat", icon: MessageSquare },
  { href: "/admin/question-bank", label: "Test Set Management", icon: BookCopy },
  { href: "/admin/test-schedule", label: "Test Schedule", icon: Calendar },
  { href: "/admin/quiz-clash", label: "Quiz Clash", icon: Puzzle },
  { href: "/admin/leaderboard", label: "Leaderboard Manager", icon: Trophy },
  { href: "/admin/store-settings", label: "Store Settings", icon: ShoppingCart },
  { href: "/admin/payment-settings", label: "Payment Settings", icon: Landmark },
  { href: "/admin/referbolt", label: "ReferBolt", icon: Zap },
  { href: "/admin/system-status", label: "System Status", icon: Server },
  { href: "/admin/admin-management", label: "Admin Management", icon: UserCog },
  { href: "/admin/security", label: "Security", icon: Shield },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
];

export const AdminSidebar = React.memo(function AdminSidebar() {
  const pathname = usePathname();
  const auth = useAuthService();

  const handleSignOut = async () => {
    if (!auth) return;
    // The FirebaseProvider handles the redirection based on the current path
    await signOut(auth);
  };

  return (
    <Sidebar collapsible="icon">
        <SidebarHeader>
            <Link href="/admin/analytics" className="flex items-center gap-2 font-bold text-primary text-lg">
                <Shield className="w-6 h-6" />
                <span className="group-data-[collapsible=icon]:hidden">Vidya EduCare</span>
            </Link>
        </SidebarHeader>
        <SidebarContent>
            <SidebarMenu>
                {adminNavItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <SidebarMenuItem key={item.href}>
                            <Link href={item.href} prefetch={true}>
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
                    <SidebarMenuButton tooltip="Sign Out" onClick={handleSignOut} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <LogOut />
                        <span>Sign Out</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
    </Sidebar>
  );
});
