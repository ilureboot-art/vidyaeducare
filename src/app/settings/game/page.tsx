
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// These would normally come from a backend and be editable by an admin.
const gameSettings = {
    maxAttempts: 5,
    rewardTiers: [100, 75, 50, 25, 15],
    welcomeBonus: 2, // tickets
};

export default function GameSettingsPage() {
    const { toast } = useToast();

    const handleSave = () => {
        // In a real app, this would save to the backend.
        toast({
            title: "Settings Saved!",
            description: "Game settings have been updated (simulation).",
        });
    }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <Link href="/settings" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Link>
          <CardTitle className="text-3xl font-bold text-primary">Game Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <p className="text-muted-foreground">Note: These settings are for display purposes. An admin panel would be required to modify them.</p>
            <div className="space-y-2">
                <Label htmlFor="maxAttempts">Max Attempts</Label>
                <Input id="maxAttempts" defaultValue={gameSettings.maxAttempts}  />
            </div>
            <div className="space-y-2">
                <Label>Reward Tiers (₹)</Label>
                <div className="grid grid-cols-5 gap-2">
                    {gameSettings.rewardTiers.map((reward, index) => (
                        <Input key={index} defaultValue={reward}  />
                    ))}
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="welcomeBonus">Welcome Bonus (Tickets)</Label>
                <Input id="welcomeBonus" defaultValue={gameSettings.welcomeBonus}  />
            </div>

             <div className="flex justify-end pt-4">
                <Button onClick={handleSave}>Save Changes</Button>
             </div>
        </CardContent>
      </Card>
    </div>
  );
}
