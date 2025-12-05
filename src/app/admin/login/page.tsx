
"use client";

import { useState, useEffect } from "react";
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
import { Shield, ArrowLeft, Eye, EyeOff, Loader2, UserPlus, AlertTriangle, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, type Firestore, runTransaction, serverTimestamp } from "firebase/firestore";
import { useAuth, useAuthService, useDb } from "@/firebase";
import type { Admin, AdminRole } from "@/lib/admin-data";

// Pre-defined credentials for the one-time Head Admin setup
const HEAD_ADMIN_EMAIL = 'admin@vidyaeducare.com';
const HEAD_ADMIN_PASSWORD = 'password123';
const HEAD_ADMIN_NAME = 'Main Admin';
const HEAD_ADMIN_PHONE = '9999999999';

export default function AdminLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuthService();
  const db = useDb();
  const { user, isAdmin } = useAuth(); // Get user and admin status from the central hook

  const [email, setEmail] = useState(typeof window !== 'undefined' ? localStorage.getItem('rememberedAdmin') || "" : "");
  const [rememberMe, setRememberMe] = useState(typeof window !== 'undefined' ? !!localStorage.getItem('rememberedAdmin') : false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [setupStatus, setSetupStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'already_exists'>('idle');
  const [setupError, setSetupError] = useState('');

  // Effect to redirect if already logged in as admin
  useEffect(() => {
    if (user && isAdmin) {
      router.push('/admin/analytics');
    }
  }, [user, isAdmin, router]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) {
        toast({ variant: "destructive", title: "Login Failed", description: "Auth service not ready. Please try again." });
        return;
    }
    setIsLoading(true);
    const password = (e.currentTarget.querySelector('#password-login') as HTMLInputElement).value;

    try {
      // Step 1: Sign in the user
      await signInWithEmailAndPassword(auth, email, password);
      
      // Step 2: Let the `useAuth` hook and ProtectedRoute handle the rest.
      // The onAuthStateChanged listener in FirebaseClientProvider will automatically
      // check for admin status and update the global state.
      // The ProtectedRoute component will then automatically redirect to the dashboard.
      if (rememberMe) {
          localStorage.setItem('rememberedAdmin', email);
      } else {
          localStorage.removeItem('rememberedAdmin');
      }
      toast({ title: "Login Successful!", description: "Redirecting to admin dashboard..." });
      // We no longer need a manual router.push here, as the ProtectedRoute will handle it.
      // A manual check here can cause race conditions.
      // router.push('/admin/analytics'); // This is now handled by ProtectedRoute
      
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
       toast({ variant: "destructive", title: "Login Failed", description: errorMessage });
    } finally {
        setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!auth) return;
    const currentEmail = (document.getElementById('email-login') as HTMLInputElement)?.value || email;
    if (!currentEmail) {
        toast({ variant: "destructive", title: "Email Required", description: "Enter your email to reset password."});
        return;
    }
    setIsLoading(true);
    try {
        await sendPasswordResetEmail(auth, currentEmail);
        toast({ title: "Password Reset Email Sent", description: `A reset link has been sent to ${currentEmail}.`});
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error Sending Email", description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  const handleCreateHeadAdmin = async () => {
    if (!db || !auth) {
        toast({ variant: "destructive", title: "Setup Failed", description: "Database service not ready." });
        return;
    }
    setSetupStatus('loading');
    
    try {
        // 1. Check if Head Admin already exists to prevent duplicates.
        const headAdminQuery = query(collection(db, "admins"), where("role", "==", "Head Admin"));
        const headAdminSnapshot = await getDocs(headAdminQuery);
        if (!headAdminSnapshot.empty) {
          setSetupStatus('already_exists');
          return;
        }

        // 2. Create the user with the main auth instance.
        const userCredential = await createUserWithEmailAndPassword(auth, HEAD_ADMIN_EMAIL, HEAD_ADMIN_PASSWORD);
        const user = userCredential.user;

        // 3. Run all database writes in a single, atomic transaction using the MAIN db connection.
        await runTransaction(db, async (transaction) => {
            const adminDocRef = doc(db, "admins", user.uid);
            transaction.set(adminDocRef, {
                name: HEAD_ADMIN_NAME, email: HEAD_ADMIN_EMAIL, phone: HEAD_ADMIN_PHONE,
                role: "Head Admin", status: "Active", joinDate: new Date().toISOString(),
            });

            const userDocRef = doc(db, "users", user.uid);
            transaction.set(userDocRef, {
              id: user.uid, name: HEAD_ADMIN_NAME, email: HEAD_ADMIN_EMAIL, phone: HEAD_ADMIN_PHONE,
              joinDate: new Date().toISOString(), status: "Active",
            });

            const walletDocRef = doc(db, "wallets", user.uid);
            transaction.set(walletDocRef, {
              balance: 0, coins: 0, referralCode: `REF${user.uid.slice(0, 6).toUpperCase()}`
            });
        });
        
        await signOut(auth);
        setSetupStatus('success');

    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            setSetupStatus('already_exists');
        } else {
            console.error("Head Admin creation failed:", error);
            setSetupError(error.message);
            setSetupStatus('error');
        }
    }
  };


  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-2 mb-4">
        <h1 className="text-4xl font-bold text-primary flex items-center gap-2 justify-center">
            <Shield className="w-10 h-10" /> Admin Panel
        </h1>
        <p className="text-muted-foreground">Vidya EduCare Administration</p>
      </div>
      <Card className="w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Head Admin Setup</TabsTrigger>
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
                                <Label htmlFor="email-login">Email Address</Label>
                                <Input id="email-login" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2 relative">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="password-login">Password</Label>
                                  <Button type="button" variant="link" className="px-0 h-auto text-xs" onClick={handleForgotPassword} disabled={isLoading || !auth}>
                                      Forgot Password?
                                  </Button>
                                </div>
                                <Input id="password-login" type={showPassword ? "text" : "password"} required />
                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-6 h-7 w-7" onClick={() => setShowPassword(prev => !prev)}>
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="remember-me-admin" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} />
                              <Label htmlFor="remember-me-admin" className="text-sm font-normal">Remember me</Label>
                            </div>
                            <Button type="submit" className="w-full !mt-6" disabled={isLoading || !auth}>
                                {isLoading || !auth ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                {auth ? 'Login' : 'Loading...'}
                            </Button>
                    </CardContent>
                </form>
            </TabsContent>
            <TabsContent value="signup">
                <CardHeader>
                    <CardTitle>Head Admin Setup</CardTitle>
                    <CardDescription>
                        Use this one-time tool to create the first Head Admin account for the application.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    {setupStatus === 'idle' && (
                        <Button onClick={handleCreateHeadAdmin} className="w-full" disabled={isLoading || !auth}>
                           {isLoading || !auth ? <Loader2 className="mr-2 animate-spin"/> : <UserPlus className="mr-2"/>}
                            Create Head Admin Account
                        </Button>
                    )}

                    {setupStatus === 'loading' && (
                        <Button disabled className="w-full">
                            <Loader2 className="mr-2 animate-spin"/> Creating Account...
                        </Button>
                    )}

                    {setupStatus === 'success' && (
                        <div className="space-y-3 text-left p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center gap-2">
                               <CheckCircle className="text-green-600"/>
                               <h3 className="font-semibold">Head Admin Created Successfully!</h3>
                            </div>
                            <p className="text-xs text-muted-foreground">You can now log in using these credentials. Please change the password after your first login.</p>
                             <div className="text-sm">
                                <p><strong>Email:</strong> {HEAD_ADMIN_EMAIL}</p>
                                <p><strong>Password:</strong> {HEAD_ADMIN_PASSWORD}</p>
                            </div>
                        </div>
                    )}
                    
                    {setupStatus === 'already_exists' && (
                        <div className="space-y-2 text-left p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                           <div className="flex items-center gap-2">
                               <AlertTriangle className="text-yellow-600"/>
                               <h3 className="font-semibold">Head Admin Already Exists</h3>
                           </div>
                           <p className="text-sm text-muted-foreground">The system already has a Head Admin. No action was taken. Please proceed to the Login tab.</p>
                        </div>
                    )}

                     {setupStatus === 'error' && (
                        <div className="space-y-2 text-left p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="flex items-center gap-2">
                               <AlertTriangle className="text-red-600"/>
                               <h3 className="font-semibold">An Error Occurred</h3>
                           </div>
                           <p className="text-sm text-muted-foreground">{setupError}</p>
                        </div>
                    )}
                    
                    {setupStatus !== 'loading' && setupStatus !== 'idle' && (
                        <Button variant="outline" onClick={() => setActiveTab('login')} className="w-full">Go to Login</Button>
                    )}
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
