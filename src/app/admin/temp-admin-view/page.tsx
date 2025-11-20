
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
import { Loader2, UserCog } from "lucide-react";
import type { Admin } from "@/lib/admin-data";
import { useFirebase } from "@/context/FirebaseClientProvider";
import { collection, getDocs, type Firestore } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TempAdminViewPage() {
  const { db, loading } = useFirebase();
  const [admins, setAdmins] = useState<Admin[] | null>(null);
  
  useEffect(() => {
    const fetchAdmins = async (firestore: Firestore) => {
      try {
        const adminsCollection = collection(firestore, "admins");
        const adminSnapshot = await getDocs(adminsCollection);
        const adminList = adminSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Admin));
        setAdmins(adminList);
      } catch (error) {
        console.error("Error fetching admins:", error);
      }
    };
    if (!loading && db) {
        fetchAdmins(db);
    }
  }, [db, loading]);

  if (loading || !admins) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <Link href="/admin/login">
        <Button variant="outline">Back to Admin Login</Button>
      </Link>
      <h1 className="text-3xl font-bold flex items-center gap-2"><UserCog /> Admin Management (Temporary View)</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Administrators</CardTitle>
          <CardDescription>
            This is a temporary, read-only view of all registered admin accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.length > 0 ? admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.name}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <Badge variant={admin.role === "Head Admin" ? "default" : "secondary"}>
                      {admin.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={admin.status === "Active" ? "default" : "destructive"}>
                      {admin.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(admin.joinDate).toLocaleDateString()}</TableCell>
                </TableRow>
              )) : (
                 <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">No admin accounts found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
