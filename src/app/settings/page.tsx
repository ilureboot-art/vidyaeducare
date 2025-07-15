
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronRight, FileText, Lock, Settings as SettingsIcon } from "lucide-react";

const settingsItems = [
    { href: "/settings/game", label: "Game Settings", icon: SettingsIcon },
    { href: "/settings/terms", label: "Terms & Conditions", icon: FileText },
    { href: "/settings/privacy", label: "Privacy Policy", icon: Lock },
];

export default function SettingsPage() {
    return (
        <div className="w-full max-w-2xl mx-auto">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-center text-primary">Settings</CardTitle>
                    <CardDescription className="text-center">
                        Manage your preferences and view legal information.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <ul className="divide-y divide-border">
                        {settingsItems.map((item) => (
                            <li key={item.href}>
                                <Link href={item.href} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <item.icon className="w-6 h-6 text-primary" />
                                        <span className="text-lg font-medium">{item.label}</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                     <div className="pt-6 text-center text-sm text-muted-foreground">
                        <p>App Version: 1.0.0</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
