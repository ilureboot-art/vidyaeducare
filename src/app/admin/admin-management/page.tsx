
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
import { UserCog, UserPlus, MoreHorizontal, Trash2 } from "lucide-react";
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

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-green-500">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
)

type AdminRole = "Head Admin" | "Sub-admin";
type AdminStatus = "Active" | "Pending" | "Rejected";

type Admin = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  status: AdminStatus;
  joinDate: string;
};

const initialAdmins: Admin[] = [
  { id: "ADM001", name: "Super Admin", email: "super@example.com", phone: "919999988888", role: "Head Admin", status: "Active", joinDate: "2024-07-01" },
];

const initialRequests: Admin[] = []

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<Admin[]>(initialAdmins);
  const [requests, setRequests] = useState<Admin[]>(initialRequests);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const openWhatsApp = (phone: string) => {
    // Remove any non-digit characters and ensure it starts with country code
    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone) {
      window.open(`https://wa.me/${cleanedPhone}`, '_blank');
    }
  }

  const handleRequest = (requestId: string, newStatus: "Active" | "Rejected") => {
    const requestToProcess = requests.find(req => req.id === requestId);
    if (!requestToProcess) return;

    setRequests(requests.filter(req => req.id !== requestId));
    
    const updatedAdmin: Admin = { ...requestToProcess, status: newStatus };

    if (newStatus === "Active") {
        const newAdmins = [...admins, updatedAdmin];
        setAdmins(newAdmins);
        // Note: In a real app, this would also be persisted to a database.
    }

    toast({
      title: `Request ${newStatus === 'Active' ? 'Approved' : 'Rejected'}`,
      description: `The request from ${requestToProcess.name} has been ${newStatus.toLowerCase()}.`,
    });
  };

  const handleCreateAdmin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const role = (form.querySelector('[name=role]') as HTMLInputElement)?.value as AdminRole | undefined;


    if (!name || !email || !phone || !password || !role) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields.'});
        return;
    }

    const newAdmin: Admin = {
        id: `ADM${String(Date.now()).slice(-3)}`,
        name,
        email,
        phone,
        role,
        status: "Active",
        joinDate: new Date().toISOString().split('T')[0],
    };

    const newAdmins = [...admins, newAdmin];
    setAdmins(newAdmins);
    toast({
        title: "Admin Created",
        description: `Admin account for ${name} has been created successfully.`
    });
    setIsCreateDialogOpen(false);
  }

  const handleDeleteAdmin = (adminId: string) => {
    const adminToDelete = admins.find(admin => admin.id === adminId);
    if (!adminToDelete) return;

    if (adminToDelete.role === "Head Admin") {
        toast({ variant: 'destructive', title: 'Action Not Allowed', description: 'Head Admins cannot be deleted.'});
        return;
    }

    setAdmins(admins.filter(admin => admin.id !== adminId));
    toast({
        title: "Admin Deleted",
        description: `Admin account for ${adminToDelete.name} has been deleted.`,
    })
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
              {requests.length > 0 ? requests.map((req) => (
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
                  <TableCell>{new Date(req.joinDate).toLocaleDateString()}</TableCell>
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
                        <DialogDescription>
                            Fill in the details to create a new administrator account. The password should be shared securely.
                        </DialogDescription>
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
                            <Input id="phone" name="phone" type="tel" required placeholder="e.g. 919876543210"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                             <Select name="role" required>
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
              {admins.map((admin) => (
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
                        <DropdownMenuItem>Edit Details</DropdownMenuItem>
                        <DropdownMenuItem>Reset Password</DropdownMenuItem>
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
    </div>
  );
}
