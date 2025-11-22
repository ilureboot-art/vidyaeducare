
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
import { Button } from "@/components/ui/button";
import { UserCog, UserPlus, MoreHorizontal, Trash2, MessageSquare, Edit, Loader2 } from "lucide-react";
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
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useFirebase, useAuth } from "@/context/FirebaseClientProvider";


const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-green-500">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
)

export default function AdminManagementPage() {
  const { db, auth } = useFirebase();
  const { user, loading, isHeadAdmin } = useAuth();
  const [allAdmins, setAllAdmins] = useState<Admin[] | null>(null);
  const [activeAdmins, setActiveAdmins] = useState<Admin[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Admin[]>([]);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPassOpen, setIsResetPassOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [newAdminRole, setNewAdminRole] = useState<AdminRole | ''>('');
  const { toast } = useToast();
  
  useEffect(() => {
    if (loading || !user || !db || !isHeadAdmin) return;

    const adminsCollection = collection(db, "admins");
    const unsubscribe = onSnapshot(adminsCollection, (adminSnapshot) => {
        const adminList = adminSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Admin));
        setAllAdmins(adminList);
    });

    return () => unsubscribe();
    
  }, [user, db, loading, isHeadAdmin]);

  useEffect(() => {
      if (allAdmins) {
          setActiveAdmins(allAdmins.filter(admin => admin.status === "Active"));
          setPendingRequests(allAdmins.filter(admin => admin.status === "Pending"));
      }
  }, [allAdmins]);

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
  
  const openEditDialog = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsEditDialogOpen(true);
  }
  
  const openResetPassDialog = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsResetPassOpen(true);
  }

  const handleSendWelcome = (admin: Admin) => {
    const message = `Hello ${admin.name}, welcome to the Vidya EduCare Admin team! We're excited to have you on board as a ${admin.role}.`;
    openWhatsApp(admin.phone, message);
    toast({
        title: "WhatsApp Opened",
        description: `A welcome message for ${admin.name} is ready to be sent.`,
    });
  }

  const handleRequest = async (requestId: string, newStatus: "Active" | "Rejected") => {
    if (!pendingRequests || !db) return;
    const requestToProcess = pendingRequests.find(req => req.id === requestId);
    if (!requestToProcess) return;

    try {
        const adminDocRef = doc(db, "admins", requestId);
        if (newStatus === "Active") {
            await updateDoc(adminDocRef, { status: "Active" });
        } else {
            await deleteDoc(adminDocRef);
        }
        
        toast({
          title: `Request ${newStatus === 'Active' ? 'Approved' : 'Rejected'}`,
          description: `The request from ${requestToProcess.name} has been ${newStatus.toLowerCase()}.`,
        });

    } catch (error) {
        console.error("Error processing request:", error);
        toast({ variant: 'destructive', title: "Error", description: "Could not process the request."});
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !auth) return;
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const role = newAdminRole;

    if (!name || !email || !phone || !role || !password) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields.'});
        return;
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const newAdminData = {
            name,
            email,
            phone,
            role,
            status: 'Active',
            joinDate: new Date().toISOString(),
        };

        await setDoc(doc(db, "admins", user.uid), newAdminData);

        toast({ title: 'Admin Created!', description: `${name} has been added.`});
        setIsCreateDialogOpen(false);

    } catch(error: any) {
         console.error("Error creating admin:", error);
         toast({ variant: 'destructive', title: "Error creating admin", description: error.message || 'An unknown error occurred.'});
    }
  }
  
  const handleEditAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAdmin || !activeAdmins || !db) return;
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name-edit') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email-edit') as HTMLInputElement).value;
    const phone = (form.elements.namedItem('phone-edit') as HTMLInputElement).value;
    const role = (form.querySelector('[name=role-edit]') as HTMLInputElement)?.value as AdminRole | undefined;

    if (!name || !email || !phone || !role) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields.'});
        return;
    }
    
    const updatedData = { name, email, phone, role };

    try {
        await updateDoc(doc(db, "admins", selectedAdmin.id), updatedData);
        
        toast({ title: 'Admin Updated', description: `${name}'s details have been saved.`});
        setIsEditDialogOpen(false);
    } catch (error) {
        console.error("Error updating admin:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update admin details.'});
    }
  }
  
  const handleResetPassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    
    toast({
        variant: "destructive",
        title: 'Action Not Supported',
        description: 'Resetting another user\'s password requires a backend function for security reasons.'
    });
    setIsResetPassOpen(false);
  }

  const handleDeleteAdmin = async (adminId: string) => {
    if (!activeAdmins || !db) return;
    const adminToDelete = activeAdmins.find(admin => admin.id === adminId);
    if (!adminToDelete) return;

    if (adminToDelete.role === "Head Admin") {
        toast({ variant: 'destructive', title: 'Action Not Allowed', description: 'Head Admins cannot be deleted.'});
        return;
    }
    
    try {
        await deleteDoc(doc(db, "admins", adminId));
        toast({
            title: "Admin Deleted",
            description: `Admin account for ${adminToDelete.name} has been deleted. Note: Auth user may still exist.`,
        })
    } catch(error) {
        console.error("Error deleting admin:", error);
        toast({ variant: 'destructive', title: "Error", description: `Could not delete ${adminToDelete.name}.` });
    }
  }

  if (loading || allAdmins === null) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!isHeadAdmin) {
      return (
          <div className="flex justify-center items-center h-96">
              <Card>
                  <CardHeader>
                      <CardTitle>Access Denied</CardTitle>
                      <CardDescription>You do not have permission to view this page.</CardDescription>
                  </CardHeader>
              </Card>
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2"><UserCog /> Admin Management</h1>

       <Card>
        <CardHeader>
          <CardTitle>Sub-admin Requests</CardTitle>
          <CardDescription>
            Approve or reject requests from users who want to become sub-admins.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests.length > 0 ? pendingRequests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.name}</TableCell>
                  <TableCell>
                      <div className="flex items-center gap-2">
                        <span>+{req.phone}</span>
                         <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openWhatsApp(req.phone)}>
                            <WhatsAppIcon />
                         </Button>
                      </div>
                  </TableCell>
                  <TableCell>{format(new Date(req.joinDate), 'P')}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center">
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" onClick={() => handleRequest(req.id, "Active")}>Approve</Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleRequest(req.id, "Rejected")}>Reject</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">No pending requests.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Administrators</CardTitle>
                <CardDescription>
                    View and manage all admin accounts.
                </CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Admin ID
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Admin</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateAdmin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" name="email" type="email" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="phone">WhatsApp Number (with country code)</Label>
                            <Input id="phone" name="phone" type="tel" required placeholder="e.g., 919876543210"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                             <Select name="role" required value={newAdminRole} onValueChange={(value) => setNewAdminRole(value as AdminRole)}>
                                <SelectTrigger id="role">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Head Admin">Head Admin</SelectItem>
                                    <SelectItem value="Sub-admin">Sub-admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Create Admin</Button>
                        </DialogFooter>
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
                <TableHead>Status</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeAdmins.map((admin) => (
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
                  <TableCell>
                      <div className="flex items-center gap-2">
                        <span>+{admin.phone}</span>
                         <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openWhatsApp(admin.phone)}>
                            <WhatsAppIcon />
                         </Button>
                      </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleSendWelcome(admin)}>
                            <MessageSquare className="mr-2 h-4 w-4"/>
                            Send Welcome Message
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(admin)} disabled={admin.role === "Head Admin"}>
                            <Edit className="mr-2 h-4 w-4"/>
                            Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openResetPassDialog(admin)}>Reset Password</DropdownMenuItem>
                         {admin.role !== "Head Admin" && (
                            <DropdownMenuItem className="text-red-600 focus:text-red-500 focus:bg-red-950/50" onClick={() => handleDeleteAdmin(admin.id)}>
                                <Trash2 className="mr-2 h-4 w-4"/>
                                Delete Admin
                            </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Edit Admin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Admin Details</DialogTitle>
            </DialogHeader>
            {selectedAdmin && (
                <form onSubmit={handleEditAdmin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name-edit">Full Name</Label>
                        <Input id="name-edit" name="name-edit" defaultValue={selectedAdmin.name} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email-edit">Email Address</Label>
                        <Input id="email-edit" name="email-edit" type="email" defaultValue={selectedAdmin.email} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone-edit">WhatsApp Number</Label>
                        <Input id="phone-edit" name="phone-edit" type="tel" defaultValue={selectedAdmin.phone} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role-edit">Role</Label>
                        <Select name="role-edit" defaultValue={selectedAdmin.role} required>
                            <SelectTrigger id="role-edit">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Head Admin">Head Admin</SelectItem>
                                <SelectItem value="Sub-admin">Sub-admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            )}
        </DialogContent>
      </Dialog>
      
      {/* Reset Password Dialog */}
      <Dialog open={isResetPassOpen} onOpenChange={setIsResetPassOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Reset Password for {selectedAdmin?.name}</DialogTitle>
                  <DialogDescription>
                      Enter a new password. This change is immediate.
                  </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" name="new-password" type="password" required />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" name="confirm-password" type="password" required />
                  </div>
                   <DialogFooter>
                        <Button type="submit">Reset Password</Button>
                    </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
    </div>
  );
}

    