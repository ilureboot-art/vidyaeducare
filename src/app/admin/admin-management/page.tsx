"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { UserCog, UserPlus, Trash2, Loader2, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Admin, AdminRole } from "@/lib/admin-data";
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query } from "firebase/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { useAuth, useDb } from "@/firebase";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function AdminManagementPage() {
  const db = useDb();
  const { user, loading: authLoading, isHeadAdmin, isResolved } = useAuth();
  const [allAdmins, setAllAdmins] = useState<Admin[] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAdminRole, setNewAdminRole] = useState<AdminRole | ''>('');
  const [isCreating, setIsCreating] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { toast } = useToast();
  
  const fetchAdmins = useCallback(() => {
    if (!isResolved || !db || !user || !isHeadAdmin) {
        if (isResolved && !isHeadAdmin) {
          setAllAdmins([]);
          setIsRefreshing(false);
        }
        return () => {};
    }

    setIsRefreshing(true);
    const adminsCollection = collection(db, "admins");
    const q = query(adminsCollection);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const adminList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Admin));
        setAllAdmins(adminList);
        setIsRefreshing(false);
    }, async (error) => {
        console.error("Admin sync error:", error.code);
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: adminsCollection.path,
                operation: 'list',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        }
        setAllAdmins([]);
        setIsRefreshing(false);
    });

    return unsubscribe;
  }, [db, user, isHeadAdmin, isResolved]);

  useEffect(() => {
    const unsub = fetchAdmins();
    return () => unsub();
  }, [fetchAdmins]);

  const handleRequest = async (requestId: string, newStatus: "Active" | "Rejected") => {
    if (!allAdmins || !db) return;
    const requestToProcess = allAdmins.find(req => req.id === requestId);
    if (!requestToProcess) return;

    const adminDocRef = doc(db, "admins", requestId);
    if (newStatus === "Active") {
        updateDoc(adminDocRef, { status: "Active" })
            .then(() => toast({ title: `Request Approved` }))
            .catch(async (e) => {
                const permissionError = new FirestorePermissionError({
                    path: adminDocRef.path,
                    operation: 'update',
                    requestResourceData: { status: 'Active' },
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            });
    } else {
        deleteDoc(adminDocRef)
            .then(() => toast({ title: `Request Rejected` }))
            .catch(async (e) => {
                const permissionError = new FirestorePermissionError({
                    path: adminDocRef.path,
                    operation: 'delete',
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            });
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || isCreating) return;
    
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const role = newAdminRole;

    if (!name || !email || !phone || !role || !password) return;
    
    setIsCreating(true);
    let secondaryApp;
    try {
        const firebaseConfig = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };

        secondaryApp = initializeApp(firebaseConfig, "secondary-auth-" + Date.now());
        const secondaryAuth = getAuth(secondaryApp);
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        
        const newAdminData: Omit<Admin, 'id'> = {
            name, email, phone, role: role as AdminRole,
            status: 'Active', joinDate: new Date().toISOString(),
        };

        const adminDocRef = doc(db, "admins", userCredential.user.uid);
        setDoc(adminDocRef, newAdminData)
            .then(() => {
                toast({ title: 'Admin Created!' });
                setIsCreateDialogOpen(false);
            })
            .catch(async (e) => {
                const permissionError = new FirestorePermissionError({
                    path: adminDocRef.path,
                    operation: 'create',
                    requestResourceData: newAdminData,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            });

    } catch(error: any) {
         toast({ variant: 'destructive', title: "Auth Error", description: error.message});
    } finally {
        if (secondaryApp) await deleteApp(secondaryApp);
        setIsCreating(false);
    }
  }

  const handleDeleteAdmin = async (adminId: string) => {
    if (!allAdmins || !db) return;
    const adminToDelete = allAdmins.find(admin => admin.id === adminId);
    if (!adminToDelete || adminToDelete.role === "Head Admin") return;
    
    const adminDocRef = doc(db, "admins", adminId);
    deleteDoc(adminDocRef)
        .then(() => toast({ title: "Admin Deleted" }))
        .catch(async (e) => {
            const permissionError = new FirestorePermissionError({
                path: adminDocRef.path,
                operation: 'delete',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        });
  }

  const filteredAdmins = useMemo(() => {
    if (!allAdmins) return [];
    return allAdmins.filter(admin => {
      const matchesSearch = admin.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           admin.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || admin.role === roleFilter;
      return matchesSearch && matchesRole && admin.status === "Active";
    });
  }, [allAdmins, searchTerm, roleFilter]);

  if (!isResolved || allAdmins === null) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-muted-foreground animate-pulse text-sm font-medium">Syncing Authority Records...</p>
      </div>
    );
  }

  if (!isHeadAdmin) {
      return (
          <div className="flex justify-center items-center h-96">
              <Card className="max-w-md w-full"><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>Only Head Administrators can manage the administrative workforce.</CardDescription></CardHeader></Card>
          </div>
      )
  }
  
  const pendingRequests = allAdmins.filter(admin => admin.status === "Pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2"><UserCog /> Admin Management</h1>
        <Button variant="outline" size="sm" onClick={() => fetchAdmins()} disabled={isRefreshing}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Records
        </Button>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Sub-admin Requests</CardTitle>
          <CardDescription>Approve or reject applications.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests.length > 0 ? pendingRequests.map((req) => (
                <TableRow key={req.id} className="even:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{req.name}</TableCell>
                  <TableCell>{req.phone}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center">
                        <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleRequest(req.id, "Active")}>Approve</Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleRequest(req.id, "Rejected")}>Reject</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground h-24">No pending requests.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>All Administrators</CardTitle>
                <CardDescription>View and manage all active accounts.</CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild><Button><UserPlus className="mr-2 h-4 w-4" /> Create Admin ID</Button></DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Create New Admin</DialogTitle></DialogHeader>
                    <form onSubmit={handleCreateAdmin} className="space-y-4">
                        <div className="space-y-2"><Label>Full Name</Label><Input id="name" name="name" required /></div>
                        <div className="space-y-2"><Label>Email</Label><Input id="email" name="email" type="email" required /></div>
                        <div className="space-y-2"><Label>Phone</Label><Input id="phone" name="phone" required /></div>
                        <div className="space-y-2"><Label>Password</Label><Input id="password" name="password" type="password" required /></div>
                        <div className="space-y-2">
                             <Label>Role</Label>
                             <Select name="role" required value={newAdminRole} onValueChange={(value) => setNewAdminRole(value as AdminRole)}>
                                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                                <SelectContent><SelectItem value="Head Admin">Head Admin</SelectItem><SelectItem value="Sub-admin">Sub-admin</SelectItem></SelectContent>
                            </Select>
                        </div>
                        <DialogFooter><Button type="submit" disabled={isCreating}>{isCreating && <Loader2 className="animate-spin mr-2"/>} Create</Button></DialogFooter>
                    </form>
                </DialogContent>
              </Dialog>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.map((admin) => (
                <TableRow key={admin.id} className="even:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{admin.name}</TableCell>
                   <TableCell className="text-xs font-mono">{admin.email}</TableCell>
                   <TableCell><Badge variant={admin.role === "Head Admin" ? "default" : "secondary"}>{admin.role}</Badge></TableCell>
                  <TableCell>
                    {admin.role !== "Head Admin" && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAdmin(admin.id)} className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}