"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Landmark, Loader2, RefreshCcw } from "lucide-react";
import type { AdminPaymentMethods } from "@/lib/user-data";
import Image from "next/image";
import { useDb } from "@/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const defaultPaymentMethods: AdminPaymentMethods = {
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    gpayNumber: "",
    gpayUpiId: "",
    phonepeNumber: "",
    phonepeUpiId: "",
    qrCodeUrl: ""
};

export default function PaymentSettingsPage() {
    const { toast } = useToast();
    const db = useDb();
    const [methods, setMethods] = useState<AdminPaymentMethods | null>(null);
    const [qrFile, setQrFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        if (!db) return;

        setIsLoading(true);
        const docRef = doc(db, "configs", "paymentMethods");
        
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setMethods(docSnap.data() as AdminPaymentMethods);
            } else {
                setMethods(defaultPaymentMethods);
            }
            setIsLoading(false);
        }, (error) => {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'configs/paymentMethods', operation: 'get' }));
            } else {
                console.error("Payment Sync Error:", error);
                setMethods(defaultPaymentMethods);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [db]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (!methods) return;
        setMethods(prev => prev ? ({ ...prev, [name]: value }) : null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setQrFile(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!methods || !db || isSaving) return;
        
        setIsSaving(true);
        const updateConfig = async (finalMethods: AdminPaymentMethods) => {
            const docRef = doc(db, "configs", "paymentMethods");
            setDoc(docRef, finalMethods)
                .then(() => {
                    toast({
                        title: "Settings Saved!",
                        description: "Payment method details have been successfully updated.",
                    });
                })
                .catch(async (error) => {
                    const permissionError = new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'update',
                        requestResourceData: finalMethods,
                    } satisfies SecurityRuleContext);
                    errorEmitter.emit('permission-error', permissionError);
                })
                .finally(() => setIsSaving(false));
        }
        
        if (qrFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                const finalMethods = { ...methods, qrCodeUrl: dataUrl };
                setMethods(finalMethods);
                updateConfig(finalMethods);
            };
            reader.readAsDataURL(qrFile);
        } else {
             updateConfig(methods);
        }
    }

    if (isLoading && !methods) {
        return (
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-muted-foreground animate-pulse font-medium">Synchronizing Secure Workspace...</p>
          </div>
        );
    }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payment Settings</h1>
        <Button variant="ghost" size="sm" onClick={() => window.location.reload()}><RefreshCcw className="w-4 h-4 mr-2"/> Re-sync</Button>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Landmark /> Company Payment Details</CardTitle>
                <CardDescription>Configure the payment methods for users to deposit funds. This information will be displayed to users in their wallet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold">Bank Account Details</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="accountHolderName">Account Holder Name</Label>
                            <Input id="accountHolderName" name="accountHolderName" value={methods?.accountHolderName || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bankName">Bank Name</Label>
                            <Input id="bankName" name="bankName" value={methods?.bankName || ''} onChange={handleChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="accountNumber">Account Number</Label>
                            <Input id="accountNumber" name="accountNumber" value={methods?.accountNumber || ''} onChange={handleChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="ifscCode">IFSC Code</Label>
                            <Input id="ifscCode" name="ifscCode" value={methods?.ifscCode || ''} onChange={handleChange} />
                        </div>
                     </div>
                </div>

                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold">UPI Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="upiId">Main UPI ID</Label>
                            <Input id="upiId" name="upiId" value={methods?.upiId || ''} onChange={handleChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="gpayNumber">GPay Number</Label>
                            <Input id="gpayNumber" name="gpayNumber" value={methods?.gpayNumber || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gpayUpiId">GPay UPI ID</Label>
                            <Input id="gpayUpiId" name="gpayUpiId" value={methods?.gpayUpiId || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phonepeNumber">PhonePe Number</Label>
                            <Input id="phonepeNumber" name="phonepeNumber" value={methods?.phonepeNumber || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phonepeUpiId">PhonePe UPI ID</Label>
                            <Input id="phonepeUpiId" name="phonepeUpiId" value={methods?.phonepeUpiId || ''} onChange={handleChange} />
                        </div>
                         <div className="space-y-2 col-span-full">
                            <Label htmlFor="qrCode">Payment QR Code</Label>
                            <Input id="qrCode" type="file" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
                            <p className="text-xs text-muted-foreground">Upload an image of the payment QR code. It will be displayed to users.</p>
                            {methods?.qrCodeUrl && <Image src={methods.qrCodeUrl} alt="Current QR Code" className="w-24 h-24 mt-2 rounded-md" width={96} height={96} />}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
        <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="animate-spin mr-2"/>} Save Changes</Button>
        </div>
      </form>
    </div>
  );
}