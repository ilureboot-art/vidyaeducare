"use client";

import { useState, useEffect, useMemo } from "react";
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
import { UserCog, UserPlus, MoreHorizontal, Trash2, MessageSquare, Edit, Loader2, Search, FilterX } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { format } from 'date-fns';
import type { Admin, AdminRole } from "@/lib/admin-data";
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { useAuth, useDb } from "@/firebase";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-green-500">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
)

export default function AdminManagementPage() {
  const db = useDb();
  const { user, loading: authLoading, isHeadAdmin } = useAuth();
  const [allAdmins, setAllAdmins] = useState<Admin[] | null>(null);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPassOpen, setIsResetPassOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [newAdminRole, setNewAdminRole] = useState<AdminRole | ''>('');
  const [isCreating, setIsCreating] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { toast } = useToast();
  
  useEffect(() => {
    if (authLoading || !db || !user) return;
    
    if (!isHeadAdmin) {
        setAllAdmins([]);
        return;
    };

    const adminsCollection = collection(db, "admins");
    const unsubscribe = onSnapshot(adminsCollection, (snapshot) => {
        const adminList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Admin));
        setAllAdmins(adminList);
    }, async (error) => {
        const permissionError = new FirestorePermissionError({
            path: adminsCollection.path,
            operation: 'list',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        setAllAdmins([]);
    });

    return () => unsubscribe();
  }, [db, user, isHeadAdmin, authLoading]);


  const openWhatsApp = (phone: string, message?: string) => {
    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone) {
        let url = `https://wa.me/${cleanedPhone}`;
        if (message) {
            url += `?text=${encodeURIComponent(message)}`;
        }
        window.open(url, '_blank');
    }
  }
  
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

  if (authLoading || allAdmins === null) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!isHeadAdmin) {
      return (
          <div className="flex justify-center items-center h-96">
              <Card><CardHeader><CardTitle>Access Denied</CardTitle></CardHeader></Card>
          </div>
      )
  }
  
  const pendingRequests = allAdmins.filter(admin => admin.status === "Pending");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2"><UserCog /> Admin Management</h1>

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