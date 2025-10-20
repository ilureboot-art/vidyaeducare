
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { getStoreConfig, setGameSettings, type GameSettings } from "@/lib/store-config";
import { Loader2 } from "lucide-react";

export default function AdminGameSettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<GameSettings | null>(null);
    
    useEffect(() => {
        const config = getStoreConfig();
        setSettings(config.gameSettings);
    }, []);

    const handleRewardChange = (index: number, value: string) => {
        if (!settings) return;
        const newRewards = [...settings.rewards];
        newRewards[index] = Number(value);
        setSettings(prev => prev ? ({...prev, rewards: newRewards}) : null);
    }
    
    const handleSettingChange = (field: keyof GameSettings, value: string) => {
        if (!settings) return;
        setSettings(prev => prev ? ({ ...prev, [field]: Number(value) }) : null);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;
        setGameSettings(settings);
        toast({
            title: "Settings Saved!",
            description: "Game settings have been successfully updated.",
        });
    }

    if (!settings) {
        return (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        );
    }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Game Settings</h1>
      <form onSubmit={handleSubmit}>
        <Card>
            <CardHeader>
                <CardTitle>Core Gameplay</CardTitle>
                <CardDescription>Adjust the fundamental rules of the GuessMaster game.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="maxAttempts">Max Attempts</Label>
                        <Input id="maxAttempts" type="number" value={settings.maxAttempts} onChange={(e) => handleSettingChange('maxAttempts', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="welcomeBonus">Welcome Bonus (Tickets)</Label>
                        <Input id="welcomeBonus" type="number" value={settings.welcomeBonus} onChange={(e) => handleSettingChange('welcomeBonus', e.target.value)} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Reward Tiers (by attempt)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {settings.rewards.map((reward, index) => (
                            <Input 
                                key={index}
                                type="number" 
                                value={reward}
                                onChange={(e) => handleRewardChange(index, e.target.value)}
                                aria-label={`Reward for ${index + 1}st attempt`} 
                            />
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
            <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
