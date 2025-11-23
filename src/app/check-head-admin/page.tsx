
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, UserCheck, AlertTriangle, ArrowLeft } from "lucide-react";
import { useFirebase } from "@/firebase";
import { collection, query, where, getDocs, type Firestore } from "firebase/firestore";
import type { Admin } from "@/lib/admin-data";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CheckHeadAdminPage() {
  const { db } = useFirebase();
  const [headAdmin, setHeadAdmin] = useState<Admin | null | undefined>(undefined); // undefined for loading state
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setError("Database service is not available.");
      return;
    };

    const fetchHeadAdmin = async () => {
      try {
        const adminsCollection = collection(db, "admins");
        const headAdminQuery = query(adminsCollection, where("role", "==", "Head Admin"));
        const headAdminSnapshot = await getDocs(headAdminQuery);

        if (headAdminSnapshot.empty) {
          setHeadAdmin(null); // No Head Admin found
        } else {
          // Assuming there's only one Head Admin
          const adminDoc = headAdminSnapshot.docs[0];
          setHeadAdmin({ id: adminDoc.id, ...adminDoc.data() } as Admin);
        }
      } catch (e: any) {
        console.error("Error fetching Head Admin:", e);
        setError(e.message || "An unknown error occurred while fetching data.");
        setHeadAdmin(null);
      }
    };

    fetchHeadAdmin();
  }, [db]);

  const renderContent = () => {
    if (headAdmin === undefined) {
      return (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p>Checking for Head Admin...</p>
        </div>
      );
    }

    if (error) {
       return (
        <div className="flex flex-col items-center gap-4 text-destructive">
          <AlertTriangle size={32} />
          <p className="font-semibold">An Error Occurred</p>
          <p className="text-sm">{error}</p>
        </div>
      );
    }
    
    if (headAdmin === null) {
        return (
             <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <AlertTriangle size={32} />
                <p className="font-semibold">No Head Admin Found</p>
                <p className="text-sm text-center">The system could not find a user with the 'Head Admin' role in the database. Please try the setup process again.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4 text-left w-full">
            <div className="flex items-center gap-3">
                <UserCheck size={32} className="text-green-500" />
                <h2 className="text-xl font-semibold">Head Admin Found</h2>
            </div>
            <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                <p><strong>User ID (UID):</strong> <span className="font-mono">{headAdmin.id}</span></p>
                <p><strong>Name:</strong> {headAdmin.name}</p>
                <p><strong>Email:</strong> {headAdmin.email}</p>
                <p><strong>Phone:</strong> {headAdmin.phone}</p>
                <p><strong>Role:</strong> <span className="font-semibold text-primary">{headAdmin.role}</span></p>
                <p><strong>Status:</strong> <span className="font-semibold text-green-600">{headAdmin.status}</span></p>
            </div>
            <p className="text-xs text-muted-foreground">Please use the email above to log in. The User ID should exist in the Firebase Authentication service.</p>
        </div>
    );
  }


  return (
     <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted">
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle>Head Admin Verification</CardTitle>
                <CardDescription>This page checks the database for the registered Head Admin.</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[200px] flex items-center justify-center">
                {renderContent()}
            </CardContent>
             <CardFooter className="flex-col gap-4">
                 <p className="text-xs text-muted-foreground">If the details are correct but you still can't log in, the password might be incorrect or the user may not exist in the authentication system.</p>
                <Link href="/admin/login" className="w-full">
                    <Button variant="outline" className="w-full">
                        <ArrowLeft className="mr-2"/>
                        Back to Admin Login
                    </Button>
                </Link>
             </CardFooter>
        </Card>
     </div>
  );
}
