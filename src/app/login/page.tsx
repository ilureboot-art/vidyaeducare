
"use client";

import { useState } from "react";
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
import { Gamepad2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const DEMO_OTP = "123456";

export default function LoginPage() {
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOtpSent(true);
    toast({
      title: "OTP Sent (Demo)",
      description: `For demonstration purposes, your OTP is ${DEMO_OTP}`,
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === DEMO_OTP) {
        toast({
            title: "Login Successful!",
            description: "Welcome back!",
        });
        router.push("/");
    } else {
        toast({
            variant: "destructive",
            title: "Invalid OTP",
            description: "The OTP you entered is incorrect.",
        });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-screen space-y-4">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-primary flex items-center gap-2 justify-center">
            <Gamepad2 className="w-10 h-10" /> GuessMaster
        </h1>
        <p className="text-muted-foreground">Welcome back! Please login to your account.</p>
      </div>
      <Card className="w-full">
        <form onSubmit={isOtpSent ? handleLogin : handleSendOtp}>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              {isOtpSent ? "Enter the OTP we 'sent' to your number." : "Enter your WhatsApp number to receive a login OTP."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp Number</Label>
              <Input id="phone" type="tel" placeholder="+91 12345 67890" required disabled={isOtpSent} />
            </div>
            {isOtpSent && (
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input 
                  id="otp" 
                  type="text" 
                  required 
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
            )}
          </CardContent>
          <CardContent>
            <Button className="w-full" type="submit">
              {isOtpSent ? "Login with OTP" : "Send OTP"}
            </Button>
            {isOtpSent && (
                <div className="mt-4 text-center text-sm">
                    <Button variant="link" className="px-1" onClick={() => setIsOtpSent(false)}>Use a different number</Button>
                </div>
            )}
          </CardContent>
        </form>
      </Card>
      <div className="text-center text-sm">
        Don't have an account?{" "}
        <Link href="/signup" passHref>
            <Button variant="link" className="px-1">Sign up</Button>
        </Link>
      </div>
       <div className="text-center text-sm">
            <Link href="/admin/login" passHref>
                <Button variant="link" size="sm" className="text-muted-foreground">
                    <Shield className="mr-2"/> Admin Portal
                </Button>
            </Link>
      </div>
    </div>
  );
}
