"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Landmark, Loader2, RefreshCcw, X, Upload, AlertCircle, Eraser } from "lucide-react";
import type { AdminPaymentMethods } from "@/lib/user-data";
import Image from "next/image";
import { useDb, useAuth } from "@/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const paymentSchema = z.object({
    accountHolderName: z.string().min(3, "Name is too short"),
    bankName: z.string().min(2, "Bank name is required"),
    accountNumber: z.string().regex(/^\d{9,18}$/, "Account number must be 9-18 digits"),
    ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC format (e.g. ABCD0123456)"),
    upiId: z.string().regex(/^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+$/, "Invalid UPI ID format"),
    gpayNumber: z.string().regex(/^\d{10}$/, "Must be 10 digits").or(z.literal("")),
    gpayUpiId: z.string().regex(/^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+$/, "Invalid UPI ID format").or(z.literal("")),
    phonepeNumber: z.string().regex(/^\d{10}$/, "Must be 10 digits").or(z.literal("")),
    phonepeUpiId: z.string().regex(/^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+$/, "Invalid UPI ID format").or(z.literal("")),
    qrCodeUrl: z.string().optional()
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

export default function PaymentSettingsPage() {
    const { toast } = useToast();
    const db = useDb();
    const { user, isResolved } = useAuth();
    const [qrFile, setQrFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeQrUrl, setActiveQrUrl] = useState<string>("");

    const { register, handleSubmit, reset, formState: { errors } } = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentSchema),
        mode: "onChange"
    });
    
    useEffect(() => {
        if (!db || !user || !isResolved) {
            // Ensure we stop spinning if auth resolution is complete but services are missing
            if (isResolved) setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const docRef = doc(db, "configs", "paymentMethods");
        
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as AdminPaymentMethods;
                reset(data);
                setActiveQrUrl(data.qrCodeUrl || "");
            }
            setIsLoading(false);
        }, async (error) => {
            console.error("Payment methods sync error:", error.code);
            if (error.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'get',
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [db, user, isResolved, reset]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
            toast({ variant: "destructive", title: "Invalid file type", description: "Upload a PNG, JPEG, or WebP." });
            e.target.value = '';
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            toast({ variant: "destructive", title: "File too large", description: "QR code must be under 1MB." });
            e.target.value = '';
            return;
        }

        setQrFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleClearFile = () => {
        setQrFile(null);
        setPreviewUrl(null);
        const fileInput = document.getElementById('qrCode') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleClearCache = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    };

    const onSubmit = (data: PaymentFormValues) => {
        if (!db || isSaving) return;
        
        setIsSaving(true);
        const finalMethods: AdminPaymentMethods = {
            ...data,
            qrCodeUrl: previewUrl || activeQrUrl
        };

        const docRef = doc(db, "configs", "paymentMethods");
        setDoc(docRef, finalMethods)
            .then(() => {
                toast({ title: "Settings Saved!", description: "Payment details updated." });
                setQrFile(null);
                setPreviewUrl(null);
                setActiveQrUrl(finalMethods.qrCodeUrl);
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

    if (isLoading) {
        return (
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-muted-foreground animate-pulse font-medium">Syncing Secure Workspace...</p>
          </div>
        );
    }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payment Settings</h1>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleClearCache} className="text-muted-foreground">
                <Eraser className="w-4 h-4 mr-2"/> Clear Local Cache
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                <RefreshCcw className="w-4 h-4 mr-2"/> Re-sync
            </Button>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Landmark /> Company Payment Details</CardTitle>
                <CardDescription>Configure payment methods for user deposits. All fields support real-time validation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold">Bank Account Details</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="accountHolderName">Account Holder Name</Label>
                            <Input id="accountHolderName" {...register("accountHolderName")} className={errors.accountHolderName ? "border-destructive" : ""} />
                            {errors.accountHolderName && <p className="text-[10px] text-destructive flex items-center gap-1"><AlertCircle size={10}/> {errors.accountHolderName.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bankName">Bank Name</Label>
                            <Input id="bankName" {...register("bankName")} className={errors.bankName ? "border-destructive" : ""} />
                            {errors.bankName && <p className="text-[10px] text-destructive flex items-center gap-1"><AlertCircle size={10}/> {errors.bankName.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="accountNumber">Account Number</Label>
                            <Input id="accountNumber" {...register("accountNumber")} className={errors.accountNumber ? "border-destructive" : ""} />
                            {errors.accountNumber && <p className="text-[10px] text-destructive flex items-center gap-1"><AlertCircle size={10}/> {errors.accountNumber.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="ifscCode">IFSC Code</Label>
                            <Input id="ifscCode" {...register("ifscCode")} placeholder="ABCD0123456" className={errors.ifscCode ? "border-destructive" : ""} />
                            {errors.ifscCode && <p className="text-[10px] text-destructive flex items-center gap-1"><AlertCircle size={10}/> {errors.ifscCode.message}</p>}
                        </div>
                     </div>
                </div>

                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold">UPI Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="upiId">Main UPI ID</Label>
                            <Input id="upiId" {...register("upiId")} placeholder="name@bank" className={errors.upiId ? "border-destructive" : ""} />
                            {errors.upiId && <p className="text-[10px] text-destructive flex items-center gap-1"><AlertCircle size={10}/> {errors.upiId.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="gpayNumber">GPay Number</Label>
                            <Input id="gpayNumber" {...register("gpayNumber")} className={errors.gpayNumber ? "border-destructive" : ""} />
                            {errors.gpayNumber && <p className="text-[10px] text-destructive flex items-center gap-1"><AlertCircle size={10}/> {errors.gpayNumber.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gpayUpiId">GPay UPI ID</Label>
                            <Input id="gpayUpiId" {...register("gpayUpiId")} className={errors.gpayUpiId ? "border-destructive" : ""} />
                            {errors.gpayUpiId && <p className="text-[10px] text-destructive flex items-center gap-1"><AlertCircle size={10}/> {errors.gpayUpiId.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phonepeNumber">PhonePe Number</Label>
                            <Input id="phonepeNumber" {...register("phonepeNumber")} className={errors.phonepeNumber ? "border-destructive" : ""} />
                            {errors.phonepeNumber && <p className="text-[10px] text-destructive flex items-center gap-1"><AlertCircle size={10}/> {errors.phonepeNumber.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phonepeUpiId">PhonePe UPI ID</Label>
                            <Input id="phonepeUpiId" {...register("phonepeUpiId")} className={errors.phonepeUpiId ? "border-destructive" : ""} />
                            {errors.phonepeUpiId && <p className="text-[10px] text-destructive flex items-center gap-1"><AlertCircle size={10}/> {errors.phonepeUpiId.message}</p>}
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
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full mt-2">
                                    {activeQrUrl && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active QR Code</p>
                                            <div className="relative w-32 h-32 border-2 rounded-xl overflow-hidden bg-muted/20">
                                                <Image src={activeQrUrl} alt="Current QR" fill className="object-contain" />
                                            </div>
                                        </div>
                                    )}
                                    {previewUrl && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                                            <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1">
                                                <Upload size={10}/> New Preview
                                            </p>
                                            <div className="relative w-32 h-32 border-2 border-primary border-dashed rounded-xl overflow-hidden bg-primary/5">
                                                <Image src={previewUrl} alt="New QR" fill className="object-contain" />
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