
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
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuthService, useAuth } from "@/firebase";

// This file is now deprecated and will be deleted.
// The new admin login page is at /src/app/admin/login/page.tsx
export default function DeprecatedAdminLoginPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/login');
  }, [router]);
  
  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-2 mb-4">
        <h1 className="text-4xl font-bold text-primary flex items-center gap-2 justify-center">
            <Loader2 className="w-10 h-10 animate-spin" /> Redirecting...
        </h1>
        <p className="text-muted-foreground">This page has moved. Please wait.</p>
      </div>
    </div>
  );
}
