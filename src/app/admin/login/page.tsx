
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
import { Shield, Gamepad2, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminLoginPage() {
  const [isOtpSent, setIsOtpSent] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would call your backend to send an OTP
    setIsOtpSent(true);
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
                <CardHeader>
                    <CardTitle>Admin Login</CardTitle>
                    <CardDescription>
                        Enter your WhatsApp number to receive a login OTP.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <form onSubmit={handleSendOtp} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone-login">WhatsApp Number</Label>
                            <Input id="phone-login" type="tel" placeholder="+91 12345 67890" required />
                        </div>
                        {isOtpSent && (
                            <div className="space-y-2">
                                <Label htmlFor="otp-login">Enter OTP</Label>
                                <Input id="otp-login" type="text" placeholder="123456" required />
                            </div>
                        )}
                        <Button type="submit" className="w-full">
                            {isOtpSent ? 'Login with OTP' : 'Send OTP'}
                        </Button>
                    </form>
                </CardContent>
            </TabsContent>
            <TabsContent value="signup">
                 <CardHeader>
                    <CardTitle>Admin Sign Up</CardTitle>
                    <CardDescription>
                        Create a new administrator account.
                    </CardDescription>
                </CardHeader>
                 <CardContent className="space-y-4">
                     <form onSubmit={handleSendOtp} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name-signup">Full Name</Label>
                            <Input id="name-signup" placeholder="Admin Name" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone-signup">WhatsApp Number</Label>
                            <Input id="phone-signup" type="tel" placeholder="+91 12345 67890" required />
                        </div>
                        {isOtpSent && (
                             <div className="space-y-2">
                                <Label htmlFor="otp-signup">Enter OTP</Label>
                                <Input id="otp-signup" type="text" placeholder="123456" required />
                            </div>
                        )}
                        <Button type="submit" className="w-full">
                           {isOtpSent ? 'Create Account & Login' : 'Send Verification OTP'}
                        </Button>
                    </form>
                </CardContent>
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
