
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
import { Shield, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const DEMO_OTP = "123456";

export default function AdminLoginPage() {
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  // Shared function to "send" OTP
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOtpSent(true);
    toast({
      title: "OTP Sent (Demo)",
      description: `For demonstration purposes, your OTP is ${DEMO_OTP}`,
    });
  };

  // Admin Login Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would verify credentials against your backend.
    toast({
        title: "Login Successful!",
        description: "Redirecting to admin dashboard...",
    });
    router.push("/admin/analytics");
  };

  // Admin Signup Handler
  const handleSignup = (e: React.FormEvent) => {
     e.preventDefault();
    if (otp === DEMO_OTP) {
        toast({
            title: "Request Sent!",
            description: "Your request to become a sub-admin has been sent to the Head Admin for approval.",
        });
        // In a real app, this might redirect to a pending page or back to the main site.
        router.push("/");
    } else {
        toast({
            variant: "destructive",
            title: "Invalid OTP",
            description: "The OTP you entered is incorrect.",
        });
    }
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-2 mb-4">
        <h1 className="text-4xl font-bold text-primary flex items-center gap-2 justify-center">
            <Shield className="w-10 h-10" /> Admin Panel
        </h1>
        <p className="text-muted-foreground">GuessMaster Administration</p>
      </div>
      <Card className="w-full">
        <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <form onSubmit={handleLogin}>
                    <CardHeader>
                        <CardTitle>Admin Login</CardTitle>
                        <CardDescription>
                            Enter your credentials to access the admin panel.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone-login">WhatsApp Number</Label>
                                <Input id="phone-login" type="tel" placeholder="+91 12345 67890" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password-login">Password</Label>
                                <Input id="password-login" type="password" required />
                            </div>
                            <Button type="submit" className="w-full">
                                Login
                            </Button>
                    </CardContent>
                </form>
            </TabsContent>
            <TabsContent value="signup">
                 <form onSubmit={isOtpSent ? handleSignup : handleSendOtp}>
                    <CardHeader>
                        <CardTitle>Request Sub-admin Access</CardTitle>
                        <CardDescription>
                           {isOtpSent ? "Enter the OTP to verify your request." : "New admins must be approved by a Head Admin."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name-signup">Full Name</Label>
                                <Input id="name-signup" placeholder="Admin Name" required disabled={isOtpSent}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone-signup">WhatsApp Number</Label>
                                <Input id="phone-signup" type="tel" placeholder="+91 12345 67890" required disabled={isOtpSent}/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="password-signup">Password</Label>
                                <Input id="password-signup" type="password" required disabled={isOtpSent}/>
                            </div>
                            {isOtpSent && (
                                <div className="space-y-2">
                                    <Label htmlFor="otp-signup">Enter OTP</Label>
                                    <Input 
                                        id="otp-signup" 
                                        type="text" 
                                        placeholder="123456" 
                                        required 
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        />
                                </div>
                            )}
                            <Button type="submit" className="w-full">
                            {isOtpSent ? 'Submit Request' : 'Send Verification OTP'}
                            </Button>
                    </CardContent>
                 </form>
            </TabsContent>
        </Tabs>
      </Card>
      <div className="mt-4 text-center text-sm">
        <Link href="/login" passHref>
            <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2"/> Back to Player Login
            </Button>
        </Link>
      </div>
    </div>
  );
}
