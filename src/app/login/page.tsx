
"use client";

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
import { Gamepad2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would verify credentials against a backend
    toast({
        title: "Login Successful!",
        description: "Welcome back!",
    });
    router.push("/");
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-screen space-y-4">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-primary flex items-center gap-2 justify-center">
            <Gamepad2 className="w-10 h-10" /> GuessMaster
        </h1>
        <p className="text-muted-foreground">Welcome back! Please login to your account.</p>
      </div>
      <Card className="w-full">
        <form onSubmit={handleLogin}>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your WhatsApp number and password to log in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp Number</Label>
              <Input id="phone" type="tel" placeholder="+91 12345 67890" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button className="w-full" type="submit">
              Login
            </Button>
            <div className="text-center text-sm">
              <Link href="/forgot-password" passHref>
                  <Button variant="link" className="px-1 text-muted-foreground">Forgot Password?</Button>
              </Link>
            </div>
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
            <Link href="/admin/login" passHref>
                <Button variant="link" size="sm" className="text-muted-foreground">
                    <Shield className="mr-2"/> Admin Portal
                </Button>
            </Link>
      </div>
    </div>
  );
}
