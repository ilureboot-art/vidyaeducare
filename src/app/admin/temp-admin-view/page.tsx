
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
import { Loader2, Eye } from "lucide-react";
import { useFirebase } from "@/context/FirebaseClientProvider";
import { collection, onSnapshot } from "firebase/firestore";
import type { Admin } from "@/lib/admin-data";
import { format } from "date-fns";

export default function TempAdminViewPage() {
  const { db, loading } = useFirebase();
  const [allAdmins, setAllAdmins] = useState<Admin[] | null>(null);

  useEffect(() => {
    if (loading || !db) return;

    const adminsCollection = collection(db, "admins");
    const unsubscribe = onSnapshot(adminsCollection, (snapshot) => {
      const adminList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Admin));
      setAllAdmins(adminList);
    });

    return () => unsubscribe();
  }, [db, loading]);

  if (loading || !allAdmins) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2"><Eye /> Temporary Admin Viewer</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Registered Admins</CardTitle>
          <CardDescription>
            This is a read-only view of all documents in the 'admins' collection for debugging purposes.
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
                <TableHead>User ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allAdmins.length > 0 ? allAdmins.map((admin) => (
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
                  <TableCell>{format(new Date(admin.joinDate), 'P p')}</TableCell>
                  <TableCell className="font-mono text-xs">{admin.id}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                        No admin documents found in the database.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    