
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function SeedHeadAdminPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [adminCreated, setAdminCreated] = useState(false);

  const handleCreateHeadAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    if (!name || !email || !phone || !password) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields.'});
        setIsLoading(false);
        return;
    }

    try {
      // 1. Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Create the admin document in Firestore
      const newAdmin = {
          id: user.uid, // Use Firebase Auth UID as the admin ID
          name,
          email,
          phone,
          role: 'Head Admin',
          status: 'Active',
          joinDate: new Date().toISOString(),
      };
      
      await setDoc(doc(db, "admins", user.uid), newAdmin);
        
      toast({
          title: "Head Admin Created!",
          description: `The Head Admin account for ${name} has been created. You can now log in.`,
          duration: 7000,
      });
      setAdminCreated(true);

    } catch(error: any) {
        console.error("Error creating head admin:", error);
        toast({ variant: 'destructive', title: "Error", description: error.message || "Could not create head admin."});
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create First Head Admin</CardTitle>
          <CardDescription>
            Use this one-time setup form to create the primary administrator account for your application.
          </CardDescription>
        </CardHeader>
        {adminCreated ? (
            <CardContent className="text-center">
                <p className="text-green-600 font-semibold mb-4">Head Admin account created successfully!</p>
                <Button asChild>
                    <Link href="/admin/login">Go to Admin Login</Link>
                </Button>
            </CardContent>
        ) : (
            <form onSubmit={handleCreateHeadAdmin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" required placeholder="Enter admin's full name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" type="email" required placeholder="Enter admin's email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp Number (with country code)</Label>
                  <Input id="phone" name="phone" type="tel" required placeholder="e.g., 919876543210" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required placeholder="Choose a strong password" />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Creating Account...</> : 'Create Head Admin'}
                </Button>
              </CardContent>
            </form>
        )}
      </Card>
    </div>
  );
}
