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
import { useAuthService, useAuth } from "@/firebase";

export default function AdminLoginPage() {
  const { toast } = useToast();
  const auth = useAuthService();
  const { loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || isLoading || isVerifying) return;
    
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      
      if (rememberMe) {
          localStorage.setItem('rememberedAdmin', email);
      } else {
          localStorage.removeItem('rememberedAdmin');
      }
      
      setIsVerifying(true);
      toast({ title: "Authenticated", description: "Verifying administrative rights..." });
      // Role-based navigation is handled by FirebaseProvider
    } catch (error: any) {
       let errorMessage = "Invalid admin credentials.";
       if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
           errorMessage = "Incorrect admin email or password.";
       }
       toast({ variant: "destructive", title: "Login Failed", description: errorMessage });
       setIsLoading(false);
       setIsVerifying(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-2 mb-4">
        <h1 className="text-4xl font-bold text-primary flex items-center gap-2 justify-center tracking-tighter">
            <Shield className="w-10 h-10" /> ADMIN PORTAL
        </h1>
        <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest">Vidya EduCare Management</p>
      </div>
      <Card className="w-full shadow-2xl border-primary/10">
        <form onSubmit={handleLogin}>
            <CardHeader>
                <CardTitle>Admin Sign In</CardTitle>
                <CardDescription>
                    Secure access to the management console.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="admin-email">Admin Email</Label>
                        <Input 
                            id="admin-email" 
                            type="email" 
                            autoComplete="username"
                            required 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            disabled={isVerifying || isLoading} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="admin-password">Secure Password</Label>
                        <div className="relative">
                            <Input 
                                id="admin-password" 
                                type={showPassword ? "text" : "password"} 
                                autoComplete="current-password"
                                required 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isVerifying || isLoading} 
                            />
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="absolute right-1 top-1 h-8 w-8" 
                                onClick={() => setShowPassword(prev => !prev)} 
                                disabled={isVerifying || isLoading}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="remember-me-admin" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} disabled={isVerifying || isLoading} />
                        <Label htmlFor="remember-me-admin" className="text-sm font-normal">Stay logged in</Label>
                    </div>
                    <Button type="submit" className="w-full !mt-6 py-6 text-lg font-bold" disabled={isLoading || !auth || isVerifying || authLoading}>
                        {isVerifying ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> VERIFYING ROLE...</>
                        ) : isLoading ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> SECURING...</>
                        ) : 'ENTER DASHBOARD'}
                    </Button>
            </CardContent>
        </form>
      </Card>
      {isVerifying && (
          <p className="mt-4 text-xs text-muted-foreground animate-pulse font-bold uppercase tracking-widest">Checking Permissions...</p>
      )}
    </div>
  );
}