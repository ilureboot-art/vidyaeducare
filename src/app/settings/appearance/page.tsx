
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Sun, Moon, Monitor } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  const themes = [
    { name: "light", label: "Light", icon: Sun },
    { name: "dark", label: "Dark", icon: Moon },
    { name: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Link href="/settings" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </Link>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <h3 className="font-semibold">Theme</h3>
            <div className="grid grid-cols-3 gap-4">
                {themes.map((t) => {
                     const isActive = theme === t.name;
                     return (
                        <div key={t.name} onClick={() => setTheme(t.name)} className={cn("flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-colors", isActive ? "border-primary" : "border-muted hover:border-primary/50")}>
                            <t.icon className="w-8 h-8"/>
                            <span className="text-sm font-medium">{t.label}</span>
                        </div>
                     )
                })}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
