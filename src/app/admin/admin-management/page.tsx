
"use client";

import { useState } from "react";
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


type AdminRole = "Head Admin" | "Sub-admin";
type AdminStatus = "Active" | "Pending" | "Rejected";

type Admin = {
  id: string;
  name: string;
  phone: string;
  role: AdminRole;
  status: AdminStatus;
  joinDate: string;
};

const initialAdmins: Admin[] = [
  { id: "ADM001", name: "Super Admin", phone: "+91 99999 88888", role: "Head Admin", status: "Active", joinDate: "2024-07-01" },
  { id: "ADM002", name: "Sub Admin One", phone: "+91 88888 77777", role: "Sub-admin", status: "Active", joinDate: "2024-07-15" },
];

const initialRequests: Admin[] = [
    { id: "ADM003", name: "Charlie Request", phone: "+91 77777 66666", role: "Sub-admin", status: "Pending", joinDate: "2024-08-01" },
    { id: "ADM004", name: "Diana Applicant", phone: "+91 66666 55555", role: "Sub-admin", status: "Pending", joinDate: "2024-08-02" },
]

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<Admin[]>(initialAdmins);
  const [requests, setRequests] = useState<Admin[]>(initialRequests);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleRequest = (requestId: string, newStatus: "Active" | "Rejected") => {
    const requestToProcess = requests.find(req => req.id === requestId);
    if (!requestToProcess) return;

    setRequests(requests.filter(req => req.id !== requestId));
    
    const updatedAdmin: Admin = { ...requestToProcess, status: newStatus };

    if (newStatus === "Active") {
        setAdmins([...admins, updatedAdmin]);
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
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const role = (form.elements.namedItem('role') as HTMLInputElement).value as AdminRole;

    if (!name || !phone || !password || !role) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields.'});
        return;
    }

    const newAdmin: Admin = {
        id: `ADM${String(Date.now()).slice(-3)}`,
        name,
        phone,
        role,
        status: "Active",
        joinDate: new Date().toISOString().split('T')[0],
    };

    setAdmins([...admins, newAdmin]);
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
                  <TableCell>{req.phone}</TableCell>
                  <TableCell>{req.joinDate}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center">
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" onClick={() => handleRequest(req.id, "Active")}>Approve</Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleRequest(req.id, "Rejected")}>Reject</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No pending requests.</TableCell>
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
                            <Label htmlFor="phone">WhatsApp Number</Label>
                            <Input id="phone" name="phone" type="tel" required />
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
                  <TableCell>{admin.phone}</TableCell>
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
