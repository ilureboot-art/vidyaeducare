"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Landmark, Loader2, RefreshCcw, X, Upload } from "lucide-react";
import type { AdminPaymentMethods } from "@/lib/user-data";
import Image from "next/image";
import { useDb, useAuth } from "@/firebase";
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

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

export default function PaymentSettingsPage() {
    const { toast } = useToast();
    const db = useDb();
    const { user, isResolved } = useAuth();
    const [methods, setMethods] = useState<AdminPaymentMethods | null>(null);
    const [qrFile, setQrFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        // CRITICAL: Wait for database, user session, AND resolved auth claims
        // to prevent permission errors during rule execution.
        if (!db || !user || !isResolved) return;

        setIsLoading(true);
        const docRef = doc(db, "configs", "paymentMethods");
        
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setMethods(docSnap.data() as AdminPaymentMethods);
            } else {
                setMethods(defaultPaymentMethods);
            }
            setIsLoading(false);
        }, async (error) => {
            if (error.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'get',
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            } else {
                console.error("Payment Sync Error:", error);
                setMethods(defaultPaymentMethods);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [db, user, isResolved]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (!methods) return;
        setMethods(prev => prev ? ({ ...prev, [name]: value }) : null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation: Type
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
            toast({
                variant: "destructive",
                title: "Invalid file type",
                description: "Please upload a PNG, JPEG, or WebP image."
            });
            e.target.value = '';
            return;
        }

        // Validation: Size
        if (file.size > MAX_FILE_SIZE) {
            toast({
                variant: "destructive",
                title: "File too large",
                description: "QR code image must be under 1MB."
            });
            e.target.value = '';
            return;
        }

        setQrFile(file);
        
        // Immediate client-side preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleClearFile = () => {
        setQrFile(null);
        setPreviewUrl(null);
        const fileInput = document.getElementById('qrCode') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!methods || !db || isSaving) return;
        
        setIsSaving(true);
        
        // Prepare final data with either new preview or existing URL
        const finalMethods: AdminPaymentMethods = {
            ...methods,
            qrCodeUrl: previewUrl || methods.qrCodeUrl
        };

        const docRef = doc(db, "configs", "paymentMethods");
        setDoc(docRef, finalMethods)
            .then(() => {
                toast({
                    title: "Settings Saved!",
                    description: "Payment method details have been successfully updated.",
                });
                // Reset file states after successful save
                setQrFile(null);
                setPreviewUrl(null);
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
    };

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
                            <div className="flex flex-col items-start gap-4">
                                <div className="flex items-center gap-4 w-full">
                                    <Input 
                                        id="qrCode" 
                                        type="file" 
                                        onChange={handleFileChange} 
                                        accept="image/png, image/jpeg, image/webp" 
                                        className="flex-1"
                                    />
                                    {qrFile && (
                                        <Button type="button" variant="outline" size="icon" onClick={handleClearFile} title="Clear selection">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">Upload an image of the payment QR code (Max 1MB). It will be displayed to users.</p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full">
                                    {methods?.qrCodeUrl && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active QR Code</p>
                                            <div className="relative w-32 h-32 border-2 rounded-xl overflow-hidden bg-muted/20">
                                                <Image 
                                                    src={methods.qrCodeUrl} 
                                                    alt="Current QR Code" 
                                                    fill 
                                                    className="object-contain" 
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {previewUrl && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                                            <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1">
                                                <Upload size={10}/> New Preview
                                            </p>
                                            <div className="relative w-32 h-32 border-2 border-primary border-dashed rounded-xl overflow-hidden bg-primary/5">
                                                <Image 
                                                    src={previewUrl} 
                                                    alt="New QR Preview" 
                                                    fill 
                                                    className="object-contain" 
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
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
