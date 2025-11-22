
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert, UserPlus, Eye, EyeOff } from "lucide-react";
import { getFirebaseServices } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, type Firestore } from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import type { Admin } from "@/lib/admin-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function AdminCheckPage() {
  const [admins, setAdmins] = useState<Admin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  const fetchAdmins = async () => {
    try {
      const { db } = await getFirebaseServices();
      const adminsCollection = collection(db, "admins");
      const adminSnapshot = await getDocs(adminsCollection);
      const adminList = adminSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Admin));
      setAdmins(adminList);
    } catch (e: any) {
      setError(e.message || "An unknown error occurred while fetching data.");
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateFirstAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;

    try {
        const { auth, db } = await getFirebaseServices();
        
        // This is a temporary auth session just for this operation
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const adminData: Omit<Admin, 'id'> = {
            name,
            email,
            phone,
            role: 'Head Admin',
            status: 'Active',
            joinDate: new Date().toISOString(),
        };

        await setDoc(doc(db, "admins", user.uid), adminData);
        
        // IMPORTANT: Sign out immediately to avoid session confusion
        await signOut(auth);

        toast({
            title: "Head Admin Created!",
            description: "The first Head Admin account has been successfully created. You can now log in.",
            duration: 7000
        });
        
        // Refresh the list
        await fetchAdmins();

    } catch (err: any) {
        console.error("Error creating first admin:", err);
        toast({
            variant: "destructive",
            title: "Creation Failed",
            description: err.message || "An unknown error occurred."
        })
    } finally {
        setIsLoading(false);
    }
  }


  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
        <div className="text-center p-4 border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <ShieldAlert className="w-12 h-12 mx-auto text-yellow-600 dark:text-yellow-400" />
            <h1 className="text-xl font-bold mt-2">Admin Setup & Diagnostic</h1>
            <p className="text-sm text-muted-foreground">Use this page to create the first Head Admin or to view the current list of registered admins.</p>
        </div>
        
      {admins && admins.length === 0 && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserPlus /> Create First Head Admin</CardTitle>
                <CardDescription>No admins found. Use this form to create the initial Head Admin account.</CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateFirstAdmin}>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" required placeholder="Admin Name" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" name="email" type="email" required placeholder="admin@example.com" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" name="phone" type="tel" required placeholder="+911234567890" />
                    </div>
                    <div className="space-y-2 relative">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" name="password" type={showPassword ? 'text' : 'password'} required />
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
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 animate-spin" />}
                        Create Head Admin
                    </Button>
                </CardFooter>
            </form>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Registered Admin Details</CardTitle>
          <CardDescription>
            A direct view of the data in the 'admins' Firestore collection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-500 text-center p-8">
                <p className="font-bold">Could not load admin data.</p>
                <p className="text-sm">{error}</p>
            </div>
          )}
          {admins === null && !error && (
             <div className="flex justify-center items-center h-48">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          )}
          {admins && (
             <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>User ID</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {admins.length > 0 ? admins.map((admin) => (
                    <TableRow key={admin.id}>
                        <TableCell className="font-medium">{admin.name}</TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell><Badge variant={admin.role === "Head Admin" ? "default" : "secondary"}>{admin.role}</Badge></TableCell>
                        <TableCell><Badge variant={admin.status === "Active" ? "default" : "destructive"}>{admin.status}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">{admin.id}</TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">No admin documents found in the collection.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
