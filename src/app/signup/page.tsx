
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import Link from "next/link";
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
import { Gamepad2, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { defaultStoreConfig } from "@/lib/store-config";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [referralCode, setReferralCode] = useState('');
  const [referralBonus, setReferralBonus] = useState<number | null>(null);

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
    }
    setReferralBonus(defaultStoreConfig.referralBonus);
  }, [searchParams]);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, you would handle creating notifications and updating wallet data
    // on the backend after successful signup and referral code application.
    // For this demo, we just show a toast.
    
    toast({
        title: "Account Created Successfully!",
        description: `Welcome to NumberAce! ${referralCode ? 'Your welcome bonus has been applied.' : ''} Redirecting you to login.`,
    });
    router.push("/login");
  };

  if (referralBonus === null) {
      return (
          <div className="w-full max-w-md mx-auto flex items-center justify-center h-screen">
              <Loader2 className="animate-spin text-primary" size={32} />
          </div>
      );
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-screen space-y-4 p-4">
       <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-primary flex items-center gap-2 justify-center">
            <Gamepad2 className="w-10 h-10" /> NumberAce
        </h1>
        <p className="text-muted-foreground">Create your account to start your journey.</p>
      </div>
      <Card className="w-full">
        <form onSubmit={handleSignup}>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Enter your information to create an account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Alex Doe" required />
              <p className="text-xs text-muted-foreground">Your full name as it appears on your documents.</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="you@example.com" required />
                <p className="text-xs text-muted-foreground">Used for account recovery.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp Number</Label>
              <Input id="phone" type="tel" placeholder="+91 12345 67890" required />
              <p className="text-xs text-muted-foreground">We'll use this for login and important notifications.</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required />
                <p className="text-xs text-muted-foreground">Choose a strong password with at least 8 characters.</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="referral">Referral Code (Optional)</Label>
              <Input 
                id="referral" 
                placeholder="Enter referral code"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                readOnly={!!searchParams.get('ref')}
                className={!!searchParams.get('ref') ? 'bg-muted/50' : ''}
              />
              {referralCode && <p className="text-xs text-green-500">Referral code applied! You'll receive a welcome bonus.</p>}
            </div>
          </CardContent>
          <CardContent>
            <Button className="w-full" type="submit">
              Create Account
            </Button>
          </CardContent>
        </form>
      </Card>
      <div className="text-center text-sm">
        Already have an account?{" "}
         <Link href="/login" passHref>
            <Button variant="link" className="px-1">Login</Button>
        </Link>
      </div>
    </div>
  );
}
