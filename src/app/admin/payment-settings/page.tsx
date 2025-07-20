
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Landmark } from "lucide-react";
import { walletData } from "@/lib/user-data";
import { useState } from "react";

export default function PaymentSettingsPage() {
    const { toast } = useToast();
    const [methods, setMethods] = useState(walletData.adminPaymentMethods);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setMethods(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would be an API call. Here we update the shared object.
        Object.assign(walletData.adminPaymentMethods, methods);
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
                <CardDescription>Configure the payment methods for users to deposit funds. This information will be displayed to users in their wallet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold">Bank Account Details</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="accountHolderName">Account Holder Name</Label>
                            <Input id="accountHolderName" name="accountHolderName" value={methods.accountHolderName} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bankName">Bank Name</Label>
                            <Input id="bankName" name="bankName" value={methods.bankName} onChange={handleChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="accountNumber">Account Number</Label>
                            <Input id="accountNumber" name="accountNumber" value={methods.accountNumber} onChange={handleChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="ifscCode">IFSC Code</Label>
                            <Input id="ifscCode" name="ifscCode" value={methods.ifscCode} onChange={handleChange} />
                        </div>
                     </div>
                </div>

                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold">UPI Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="upiId">Main UPI ID</Label>
                            <Input id="upiId" name="upiId" value={methods.upiId} onChange={handleChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="gpayNumber">GPay Number</Label>
                            <Input id="gpayNumber" name="gpayNumber" value={methods.gpayNumber} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gpayUpiId">GPay UPI ID</Label>
                            <Input id="gpayUpiId" name="gpayUpiId" value={methods.gpayUpiId} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phonepeNumber">PhonePe Number</Label>
                            <Input id="phonepeNumber" name="phonepeNumber" value={methods.phonepeNumber} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phonepeUpiId">PhonePe UPI ID</Label>
                            <Input id="phonepeUpiId" name="phonepeUpiId" value={methods.phonepeUpiId} onChange={handleChange} />
                        </div>
                         <div className="space-y-2 col-span-full">
                            <Label htmlFor="qrCode">Payment QR Code</Label>
                            <Input id="qrCode" type="file" />
                            <p className="text-xs text-muted-foreground">Upload an image of the payment QR code. It will be displayed to users.</p>
                        </div>
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
