
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function AdminGameSettingsPage() {
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Settings Saved!",
            description: "Game settings have been successfully updated.",
        });
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
                        <Input id="maxAttempts" type="number" defaultValue="5" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="welcomeBonus">Welcome Bonus (Tickets)</Label>
                        <Input id="welcomeBonus" type="number" defaultValue="2" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Reward Tiers (by attempt)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        <Input type="number" defaultValue="100" aria-label="Reward for 1st attempt" />
                        <Input type="number" defaultValue="75" aria-label="Reward for 2nd attempt" />
                        <Input type="number" defaultValue="50" aria-label="Reward for 3rd attempt" />
                        <Input type="number" defaultValue="25" aria-label="Reward for 4th attempt" />
                        <Input type="number" defaultValue="15" aria-label="Reward for 5th attempt" />
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
