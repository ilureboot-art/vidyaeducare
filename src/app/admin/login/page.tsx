
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
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuthService } from "@/firebase";

export default function AdminLoginPage() {
  const { toast } = useToast();
  const auth = useAuthService();

  const [email, setEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    setIsLoading(true);
    const password = (e.currentTarget.querySelector('#password-login') as HTMLInputElement).value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      if (rememberMe) {
          localStorage.setItem('rememberedAdmin', email);
      } else {
          localStorage.removeItem('rememberedAdmin');
      }
      
      toast({ title: "Authorized", description: "Verifying administrative privileges..." });
      
    } catch (error: any) {
       let errorMessage = "Access Denied.";
       if (error.code === 'auth/invalid-credential') {
           errorMessage = "Invalid admin credentials.";
       }
       toast({ variant: "destructive", title: "Login Failed", description: errorMessage });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-2 mb-4">
        <h1 className="text-4xl font-bold text-primary flex items-center gap-2 justify-center">
            <Shield className="w-10 h-10" /> Admin Portal
        </h1>
        <p className="text-muted-foreground">System Administration Access</p>
      </div>
      <Card className="w-full shadow-xl">
        <form onSubmit={handleLogin}>
            <CardHeader>
                <CardTitle>Admin Login</CardTitle>
                <CardDescription>
                    Enter secure credentials to access the console.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email-login">Admin Email</Label>
                        <Input id="email-login" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2 relative">
                        <Label htmlFor="password-login">Secure Password</Label>
                        <div className="relative">
                            <Input id="password-login" type={showPassword ? "text" : "password"} required />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 h-8 w-8" onClick={() => setShowPassword(prev => !prev)}>
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="remember-me-admin" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} />
                        <Label htmlFor="remember-me-admin" className="text-sm font-normal">Stay logged in</Label>
                    </div>
                    <Button type="submit" className="w-full !mt-6" disabled={isLoading || !auth}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Enter Dashboard'}
                    </Button>
            </CardContent>
        </form>
      </Card>
    </div>
  );
}
