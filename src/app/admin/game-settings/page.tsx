
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Ban } from "lucide-react";

export default function AdminGameSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Game Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground"><Ban/>Feature Removed</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground text-center h-24 flex items-center justify-center">The game feature has been removed from the application, so its settings are no longer available.</p>
        </CardContent>
      </Card>
    </div>
  );
}
