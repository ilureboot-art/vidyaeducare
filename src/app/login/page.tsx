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
      const cleanEmail = email.trim();
      if (!cleanEmail || !password) {
          throw new Error("Please enter both email and password.");
      }

      await signInWithEmailAndPassword(authService, cleanEmail, password);

      if (rememberMe) {
        localStorage.setItem('rememberedUser', cleanEmail);
      } else {
        localStorage.removeItem('rememberedUser');
      }

      setIsVerifying(true);
      toast({
          title: "Authenticated",
          description: "Resolving your academic role...",
      });
      // Redirection is handled by FirebaseProvider
    } catch (error: any) {
       console.error("Login Error:", error.code);
       let errorMessage = "Incorrect email or password.";
       
       if (error.code === 'auth/network-request-failed') {
           errorMessage = "Connection error. Please check your internet.";
       } else if (error.code === 'auth/too-many-requests') {
           errorMessage = "Too many failed attempts. Please try again later.";
       } else if (error.code === 'auth/user-disabled') {
           errorMessage = "This account has been disabled.";
       } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
           errorMessage = "Invalid email or password.";
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
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                autoComplete="username"
                placeholder="you@example.com" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || isVerifying}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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
                <Label htmlFor="remember-me" className="text-sm font-normal">Remember me</Label>
              </div>
              <Link href="/forgot-password">
                  <Button variant="link" className="px-1 text-sm h-auto py-0" disabled={isLoading || isVerifying}>Forgot Password?</Button>
              </Link>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full font-black py-6 text-lg shadow-lg" type="submit" disabled={isLoading || authLoading || !isFirebaseReady || isVerifying}>
                {isVerifying ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> SYNCING ROLE...</>
                ) : isLoading ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> SECURING SESSION...</>
                ) : 'LOGIN TO WORKSPACE'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <div className="text-center text-sm font-medium">
        Need an account?{" "}
        <Link href="/signup" className="text-primary font-bold hover:underline">Create Account</Link>
      </div>
      {(isVerifying || authLoading) && (
          <p className="text-xs text-muted-foreground animate-pulse font-bold uppercase tracking-widest mt-4">Verifying Identity...</p>
      )}
    </div>
  );
}