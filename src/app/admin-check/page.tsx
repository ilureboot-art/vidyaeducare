
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert } from "lucide-react";
import { getFirebaseServices } from "@/lib/firebase";
import { collection, getDocs, type Firestore } from "firebase/firestore";
import type { Admin } from "@/lib/admin-data";

export default function AdminCheckPage() {
  const [admins, setAdmins] = useState<Admin[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    fetchAdmins();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
        <div className="text-center p-4 border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <ShieldAlert className="w-12 h-12 mx-auto text-yellow-600 dark:text-yellow-400" />
            <h1 className="text-xl font-bold mt-2">Temporary Admin Viewer</h1>
            <p className="text-sm text-muted-foreground">This is a temporary, read-only page to help diagnose admin login issues. It displays all documents from the 'admins' collection.</p>
        </div>
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
          {!admins && !error && (
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
