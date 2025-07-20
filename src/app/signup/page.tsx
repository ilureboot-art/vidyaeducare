
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
import { Gamepad2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { storeConfig } from "@/lib/store-config";
import { addTransaction } from "@/lib/user-data";
import { addNotification } from "@/lib/notifications";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [referralCode, setReferralCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
    }
  }, [searchParams]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOtpSent(true);
    toast({
      title: "OTP Sent",
      description: `An OTP has been sent to your WhatsApp number.`,
    });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would verify the OTP against your backend
    if (otp) {
        addNotification({
          type: "new_user",
          message: `A new user just signed up!`,
          userId: 'admin'
        });

        if (referralCode) {
            // In a real app, this logic would live on the backend.
            // Here, we just add the transaction for the new user.
             addTransaction({
                id: Date.now(),
                type: 'deposit',
                description: 'Welcome Bonus (from referral)',
                amount: storeConfig.referralBonus,
                date: new Date().toISOString(),
                status: 'Completed',
                user: "New User" // In a real app, this would be the new user's name
            });
            addNotification({
              type: 'deposit_received',
              message: `You received a ₹${storeConfig.referralBonus} Welcome Bonus!`,
              userId: 'user-alex-doe' // This should be the new user's ID
            });

             // In a real app, you would look up the referrer and credit them.
             // Here we simulate it for the main user for demo purposes.
             addTransaction({
                id: Date.now() + 1, // To avoid key collision
                type: 'deposit',
                description: `Referral Bonus for new user`,
                amount: storeConfig.referralBonus,
                date: new Date().toISOString(),
                status: 'Completed',
                user: "Alex Doe" // This is the referrer
            });
             addNotification({
              type: 'deposit_received',
              message: `You received a ₹${storeConfig.referralBonus} bonus for referring a new user.`,
              userId: 'user-alex-doe' // This is the referrer's ID
            });
        }
        toast({
            title: "Account Created Successfully!",
            description: "Welcome to GuessMaster! Redirecting you to login.",
        });
        router.push("/login");
    } else {
        toast({
            variant: "destructive",
            title: "Invalid OTP",
            description: "The OTP you entered is incorrect. Please try again.",
        });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-screen space-y-4">
       <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-primary flex items-center gap-2 justify-center">
            <Gamepad2 className="w-10 h-10" /> Vidya EduCare
        </h1>
        <p className="text-muted-foreground">Create your account to start your journey.</p>
      </div>
      <Card className="w-full">
        <form onSubmit={isOtpSent ? handleSignup : handleSendOtp}>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              {isOtpSent ? "Verify your number with the OTP." : "Enter your information to create an account."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Alex Doe" required disabled={isOtpSent} />
              <p className="text-xs text-muted-foreground">Your full name as it appears on your documents.</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="you@example.com" required disabled={isOtpSent} />
                <p className="text-xs text-muted-foreground">Used for account recovery.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp Number</Label>
              <Input id="phone" type="tel" placeholder="+91 12345 67890" required disabled={isOtpSent} />
              <p className="text-xs text-muted-foreground">We'll use this for login and important notifications.</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required disabled={isOtpSent}/>
                <p className="text-xs text-muted-foreground">Choose a strong password with at least 8 characters.</p>
            </div>
            {!isOtpSent && (
              <>
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
              </>
            )}
            {isOtpSent && (
              <div className="space-y-2">
                  <Label htmlFor="otp-signup">Enter OTP</Label>
                  <Input 
                      id="otp-signup" 
                      type="text" 
                      placeholder="Enter the 6-digit OTP"
                      required 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                  />
              </div>
            )}
          </CardContent>
          <CardContent>
            <Button className="w-full" type="submit">
              {isOtpSent ? "Verify & Create Account" : "Send Verification OTP"}
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
