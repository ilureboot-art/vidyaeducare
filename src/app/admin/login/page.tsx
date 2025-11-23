
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
import { Shield, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, runTransaction, type Firestore } from "firebase/firestore";
import { useFirebase } from "@/context/FirebaseClientProvider";
import type { Admin, AdminRole } from "@/lib/admin-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


export default function AdminLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { db, auth } = useFirebase();

  const [email, setEmail] = useState(typeof window !== 'undefined' ? localStorage.getItem('rememberedAdmin') || "" : "");
  const [rememberMe, setRememberMe] = useState(typeof window !== 'undefined' ? !!localStorage.getItem('rememberedAdmin') : false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  
  const isFirebaseReady = !!auth && !!db;
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseReady) {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Auth configuration not found. Please try again in a moment.",
        });
        return;
    }
    setIsLoading(true);
    const password = (e.currentTarget.querySelector('#password-login') as HTMLInputElement).value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUser = userCredential.user;

      const adminDocRef = doc(db, "admins", loggedInUser.uid);
      const adminDocSnap = await getDoc(adminDocRef);

      if (adminDocSnap.exists()) {
        const adminData = adminDocSnap.data() as Admin;
        if (adminData.status === 'Active') {
          if (rememberMe) {
              localStorage.setItem('rememberedAdmin', email);
          } else {
              localStorage.removeItem('rememberedAdmin');
          }

          toast({
              title: "Login Successful!",
              description: "Redirecting to admin dashboard...",
          });
           router.push('/admin/analytics');
        } else if (adminData.status === 'Pending') {
          await signOut(auth);
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Your admin account has not been approved yet.",
          });
        } else {
          await signOut(auth);
           toast({
            variant: "destructive",
            title: "Access Denied",
            description: "Your admin account is not active.",
          });
        }
      } else {
        await signOut(auth);
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have permission to access the admin panel.",
        });
      }

    } catch (error: any) {
       let errorMessage = "An unknown error occurred.";
       if (error.code) { 
          switch(error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                errorMessage = "Invalid email or password.";
                break;
            default:
                errorMessage = error.message;
                break;
          }
       } else {
          errorMessage = error.message;
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

 const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseReady) {
      toast({ variant: "destructive", title: "Signup Failed", description: "Auth service not ready." });
      return;
    }
    setIsLoading(true);
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name-signup') as HTMLInputElement).value;
    const signupEmail = (form.elements.namedItem('email-signup') as HTMLInputElement).value;
    const phone = (form.elements.namedItem('phone-signup') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password-signup') as HTMLInputElement).value;

    try {
        // Step 1: Check if a Head Admin already exists before creating an auth user.
        // This is a read operation and can be done outside the transaction.
        const adminsCollection = collection(db, "admins");
        const headAdminQuery = query(adminsCollection, where("role", "==", "Head Admin"));
        const headAdminSnapshot = await getDocs(headAdminQuery);
        const headAdminExists = !headAdminSnapshot.empty;

        // Step 2: Create the user in Firebase Auth.
        const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, password);
        const user = userCredential.user;

        // The new user is now authenticated. We can proceed to create their Firestore document.
        const role: AdminRole = headAdminExists ? "Sub-admin" : "Head Admin";
        const status: Admin['status'] = headAdminExists ? "Pending" : "Active";

        const newAdminData: Omit<Admin, 'id'> = {
            name,
            email: signupEmail,
            phone,
            role,
            status,
            joinDate: new Date().toISOString(),
        };

        // Step 3: Create the admin document in Firestore. This will be allowed by security rules
        // because the currently authenticated user's UID matches the document ID.
        await setDoc(doc(db, "admins", user.uid), newAdminData);

        toast({
            title: status === 'Active' ? "Head Admin Created!" : "Request Sent!",
            description: status === 'Active'
                ? "You can now log in with your new Head Admin credentials."
                : "Your request to become a sub-admin has been sent for approval. You will be logged out.",
            duration: 7000,
        });

        if (status === 'Pending') {
            await signOut(auth); // Sign out only if they are a pending sub-admin.
        }

        form.reset();
        setActiveTab("login");

    } catch (error: any) {
        let description = "An unknown error occurred.";
        if (error.code === 'auth/email-already-in-use') {
            description = "This email is already registered. Please log in or use 'Forgot Password'.";
        } else {
            description = error.message;
        }
        toast({
            variant: "destructive",
            title: "Signup Failed",
            description: description,
        });
    } finally {
        setIsLoading(false);
    }
};

  const handleForgotPassword = async () => {
    if (!isFirebaseReady) {
        toast({ variant: "destructive", title: "Error", description: "Auth service not available." });
        return;
    }
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
                                <Label htmlFor="email-login">Email Address</Label>
                                <Input 
                                  id="email-login" 
                                  type="email" 
                                  required 
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 relative">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="password-login">Password</Label>
                                  <Button type="button" variant="link" className="px-0 h-auto text-xs" onClick={handleForgotPassword} disabled={isLoading || !isFirebaseReady}>
                                      Forgot Password?
                                  </Button>
                                </div>
                                <Input 
                                  id="password-login" 
                                  type={showPassword ? "text" : "password"} 
                                  required 
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
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="remember-me-admin" 
                                checked={rememberMe}
                                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                              />
                              <Label htmlFor="remember-me-admin" className="text-sm font-normal">
                                Remember me
                              </Label>
                            </div>
                            <Button type="submit" className="w-full !mt-6" disabled={isLoading || !isFirebaseReady}>
                                {isLoading || !isFirebaseReady ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                {isFirebaseReady ? 'Login' : 'Loading...'}
                            </Button>
                    </CardContent>
                </form>
            </TabsContent>
            <TabsContent value="signup">
                 <form onSubmit={handleSignup}>
                    <CardHeader>
                        <CardTitle>Register as an Admin</CardTitle>
                        <CardDescription>
                           The first account created will be the Head Admin. Subsequent accounts will be Sub-admins requiring approval.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name-signup">Full Name</Label>
                                <Input id="name-signup" name="name-signup" placeholder="Admin Name" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email-signup">Email Address</Label>
                                <Input id="email-signup" name="email-signup" type="email" placeholder="you@example.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone-signup">WhatsApp Number</Label>
                                <Input id="phone-signup" name="phone-signup" type="tel" placeholder="+91 12345 67890" required />
                            </div>
                             <div className="space-y-2 relative">
                                <Label htmlFor="password-signup">Password</Label>
                                <Input id="password-signup" name="password-signup" type={showSignupPassword ? "text" : "password"} required />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-1 top-6 h-7 w-7"
                                  onClick={() => setShowSignupPassword(prev => !prev)}
                                >
                                  {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  <span className="sr-only">Toggle password visibility</span>
                                </Button>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading || !isFirebaseReady}>
                                {isLoading || !isFirebaseReady ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                {isFirebaseReady ? 'Submit' : 'Loading...'}
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
    