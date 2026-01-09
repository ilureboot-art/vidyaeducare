
"use client";

import { useState, useEffect } from "react";
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
import { Gamepad2, Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuthService, useAuth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuthService();
  const { user } = useAuth(); // Get user from central hook

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const isFirebaseReady = !!auth;

  // Effect to redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/profile");
    }
  }, [user, router]);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedUser');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseReady) {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Authentication service is not ready. Please wait a moment and try again.",
        });
        return;
    }
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      if (rememberMe) {
        localStorage.setItem('rememberedUser', email);
      } else {
        localStorage.removeItem('rememberedUser');
      }

      toast({
          title: "Login Successful!",
          description: "Welcome back!",
      });
      // The useEffect hook will now handle the redirect to /profile

    } catch (error: any) {
       let errorMessage = "An unknown error occurred.";
       if (error.code) { 
          switch(error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                errorMessage = "Invalid email or password. Please check your credentials and try again.";
                break;
            default:
                errorMessage = error.message;
          }
       }
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: errorMessage,
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-screen space-y-4 p-4">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-primary flex items-center gap-2 justify-center">
            <Gamepad2 className="w-10 h-10" /> Vidya EduCare
        </h1>
        <p className="text-muted-foreground">Welcome back! Please login to your account.</p>
      </div>
      <Card className="w-full">
        <form onSubmit={handleLogin}>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your email and password to log in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2 relative">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
               <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-6 h-7 w-7"
                onClick={() => setShowPassword(prev => !prev)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">Toggle password visibility</span>
              </Button>
            </div>
             <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember-me" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember-me" className="text-sm font-normal">
                  Remember me
                </Label>
              </div>
              <Link href="/forgot-password" passHref>
                  <Button variant="link" className="px-1 text-sm h-auto py-0" disabled={isLoading}>Forgot Password?</Button>
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isLoading || !isFirebaseReady}>
                {isLoading || !isFirebaseReady ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                {isFirebaseReady ? 'Login' : 'Loading...'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <div className="text-center text-sm">
        Don't have an account?{" "}
        <Link href="/signup" passHref>
            <Button variant="link" className="px-1">Sign up</Button>
        </Link>
      </div>
       <div className="text-center text-sm">
            <Link href="/admin-login" passHref>
                <Button variant="link" size="sm" className="text-muted-foreground">
                    <Shield className="mr-2"/> Admin Portal
                </Button>
            </Link>
      </div>
    </div>
  );
}
