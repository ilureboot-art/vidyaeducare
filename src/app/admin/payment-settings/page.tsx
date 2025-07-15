
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Landmark } from "lucide-react";

export default function PaymentSettingsPage() {
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Settings Saved!",
            description: "Payment method details have been successfully updated.",
        });
    }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Payment Settings</h1>
      <form onSubmit={handleSubmit}>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Landmark /> Company Payment Details</CardTitle>
                <CardDescription>Configure the payment methods for users to deposit funds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="upiId">Admin UPI ID</Label>
                    <Input id="upiId" type="text" defaultValue="admin-upi@okhdfcbank" />
                    <p className="text-xs text-muted-foreground">This UPI ID will be shown to users when they want to add funds.</p>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="gpayNumber">GPay Number</Label>
                    <Input id="gpayNumber" type="text" placeholder="e.g., +91 12345 67890" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="phonepeNumber">PhonePe Number</Label>
                    <Input id="phonepeNumber" type="text" placeholder="e.g., +91 12345 67890" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="qrCode">Payment QR Code</Label>
                    <Input id="qrCode" type="file" />
                    <p className="text-xs text-muted-foreground">Upload an image of the payment QR code.</p>
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
