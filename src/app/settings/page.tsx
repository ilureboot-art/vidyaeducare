
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronRight, User, Bell, Palette, FileText, Lock, LifeBuoy } from "lucide-react";

const settingsGroups = [
    {
        title: "Account",
        items: [
            { href: "/settings/account", label: "Profile Information", icon: User },
        ]
    },
    {
        title: "App Settings",
        items: [
            { href: "/settings/notifications", label: "Notifications", icon: Bell },
            { href: "/settings/appearance", label: "Appearance", icon: Palette },
        ]
    },
    {
        title: "Legal & Support",
        items: [
            { href: "/settings/terms", label: "Terms & Conditions", icon: FileText },
            { href: "/settings/privacy", label: "Privacy Policy", icon: Lock },
            { href: "/settings/support", label: "Support", icon: LifeBuoy },
        ]
    }
];

export default function SettingsPage() {
    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your account and preferences.</p>
            </div>
            
            {settingsGroups.map((group) => (
                 <Card key={group.title}>
                    <CardHeader>
                        <CardTitle className="text-xl">{group.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ul className="divide-y divide-border">
                            {group.items.map((item) => (
                                <li key={item.href}>
                                    <Link href={item.href} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <item.icon className="w-5 h-5 text-muted-foreground" />
                                            <span className="font-medium">{item.label}</span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            ))}

            <div className="pt-4 text-center text-sm text-muted-foreground">
                <p>App Version: 1.0.0</p>
            </div>
        </div>
    );
}
