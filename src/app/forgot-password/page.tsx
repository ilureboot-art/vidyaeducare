
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
import { Gamepad2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [step, setStep] = useState<"send-otp" | "verify-otp" | "reset-password">("send-otp");
  const [otp, setOtp] = useState("");

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, send OTP via backend
    setStep("verify-otp");
    toast({
      title: "OTP Sent",
      description: `An OTP has been sent to your WhatsApp number.`,
    });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, verify OTP via backend
    if (otp) {
      setStep("reset-password");
      toast({ title: "OTP Verified", description: "You can now set a new password." });
    } else {
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "The OTP you entered is incorrect.",
      });
    }
  };

  const handleResetPassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const password = e.currentTarget.password.value;
    const confirmPassword = e.currentTarget.confirmPassword.value;

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please re-enter your password.",
      });
      return;
    }

    toast({
      title: "Password Reset Successful!",
      description: "You can now log in with your new password.",
    });
    router.push("/login");
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-screen space-y-4">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-primary flex items-center gap-2 justify-center">
          <Gamepad2 className="w-10 h-10" /> GuessMaster
        </h1>
        <p className="text-muted-foreground">Reset your password.</p>
      </div>
      <Card className="w-full">
        {step === "send-otp" && (
          <form onSubmit={handleSendOtp}>
            <CardHeader>
              <CardTitle>Forgot Password</CardTitle>
              <CardDescription>
                Enter your WhatsApp number and we'll send you an OTP to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp Number</Label>
                <Input id="phone" type="tel" placeholder="+91 12345 67890" required />
              </div>
            </CardContent>
            <CardContent>
              <Button type="submit" className="w-full">Send Reset OTP</Button>
            </CardContent>
          </form>
        )}

        {step === "verify-otp" && (
          <form onSubmit={handleVerifyOtp}>
            <CardHeader>
              <CardTitle>Verify OTP</CardTitle>
              <CardDescription>
                Enter the OTP we sent to your WhatsApp number.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter the 6-digit OTP"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
            </CardContent>
            <CardContent>
              <Button type="submit" className="w-full">Verify OTP</Button>
            </CardContent>
          </form>
        )}

        {step === "reset-password" && (
          <form onSubmit={handleResetPassword}>
            <CardHeader>
              <CardTitle>Set New Password</CardTitle>
              <CardDescription>
                Choose a new, strong password for your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required />
              </div>
            </CardContent>
            <CardContent>
              <Button type="submit" className="w-full">Reset Password</Button>
            </CardContent>
          </form>
        )}
      </Card>
      <div className="text-center text-sm">
        <Link href="/login" passHref>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2" /> Back to Login
          </Button>
        </Link>
      </div>
    </div>
  );
}
