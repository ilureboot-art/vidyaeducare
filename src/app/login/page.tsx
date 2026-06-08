
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Gamepad2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthService, useAuth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const { toast } = useToast();
  const authService = useAuthService();
  const { loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const isFirebaseReady = !!authService;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseReady || isLoading || isVerifying) return;
    
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(authService, email, password);

      if (rememberMe) {
        localStorage.setItem('rememberedUser', email);
      } else {
        localStorage.removeItem('rememberedUser');
      }

      setIsVerifying(true);
      toast({
          title: "Access Granted",
          description: "Syncing your student profile...",
      });

    } catch (error: any) {
       console.error("Login Error:", error);
       let errorMessage = "Invalid credentials.";
       if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
           errorMessage = "Please check your email and password.";
       }
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: errorMessage,
        });
        setIsLoading(false);
        setIsVerifying(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-screen space-y-4 p-4">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-primary flex items-center gap-2 justify-center tracking-tighter">
            <Gamepad2 className="w-10 h-10" /> VIDYA EDUCARE
        </h1>
        <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest">Student & Parent Portal</p>
      </div>
      <Card className="w-full border-primary/10 shadow-xl">
        <form onSubmit={handleLogin}>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Access your students and mock tests.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-login">Email Address</Label>
              <Input 
                id="email-login" 
                type="email" 
                placeholder="you@example.com" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || isVerifying}
              />
            </div>
            <div className="space-y-2 relative">
              <Label htmlFor="password-login">Password</Label>
              <div className="relative">
                <Input 
                  id="password-login" 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || isVerifying}
                />
                 <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8"
                  onClick={() => setShowPassword(prev => !prev)}
                  disabled={isLoading || isVerifying}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">Toggle visibility</span>
                </Button>
              </div>
            </div>
             <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember-me" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading || isVerifying}
                />
                <Label htmlFor="remember-me" className="text-sm font-normal">
                  Remember me
                </Label>
              </div>
              <Link href="/forgot-password" passHref>
                  <Button variant="link" className="px-1 text-sm h-auto py-0" disabled={isLoading || isVerifying}>Forgot Password?</Button>
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button className="w-full font-black py-6 text-lg shadow-lg" type="submit" disabled={isLoading || authLoading || !isFirebaseReady || isVerifying}>
                {isVerifying ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> VERIFYING...</>
                ) : isLoading ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> SECURING SESSION...</>
                ) : 'LOGIN TO WORKSPACE'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <div className="text-center text-sm font-medium">
        Need an account?{" "}
        <Link href="/signup" passHref>
            <Button variant="link" className="px-1 font-bold" disabled={isLoading || isVerifying}>Create Account</Button>
        </Link>
      </div>
      {isVerifying && (
          <p className="text-xs text-muted-foreground animate-pulse font-bold uppercase tracking-widest">Resolving Academic Identity...</p>
      )}
    </div>
  );
}
