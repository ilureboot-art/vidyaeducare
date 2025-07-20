
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Bell } from "lucide-react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const notificationSettings = [
  { id: "gameAlerts", label: "Game Alerts", description: "When a game you're playing has an update." },
  { id: "walletUpdates", label: "Wallet Updates", description: "For deposits, withdrawals, and reward credits." },
  { id: "promotions", label: "Promotions", description: "Receive news about special offers and new features." },
  { id: "reminders", label: "Study Reminders", description: "Nudges to take mock tests or review material." },
];

export default function NotificationSettingsPage() {
    const { toast } = useToast();

    const handleSave = () => {
        toast({
            title: "Settings Saved",
            description: "Your notification preferences have been updated.",
        });
    }

  return (
    <div className="w-full max-w-2xl mx-auto">
       <Link href="/settings" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
        </Link>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Notification Settings</CardTitle>
          <CardDescription>Choose what you want to be notified about.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <ul className="divide-y divide-border">
                {notificationSettings.map((setting) => (
                    <li key={setting.id} className="flex items-center justify-between py-4">
                        <div>
                            <Label htmlFor={setting.id} className="font-medium">{setting.label}</Label>
                            <p className="text-sm text-muted-foreground">{setting.description}</p>
                        </div>
                        <Switch id={setting.id} defaultChecked={setting.id !== 'promotions'}/>
                    </li>
                ))}
            </ul>
             <div className="flex justify-end pt-4">
                <Button onClick={handleSave}>Save Changes</Button>
             </div>
        </CardContent>
      </Card>
    </div>
  );
}
