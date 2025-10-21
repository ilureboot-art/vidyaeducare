
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, MoreHorizontal, Trash2, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

type UserStatus = "Active" | "Banned" | "Inactive";
type User = {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  status: UserStatus;
  wallet: number;
};

// In a real app, this would be fetched from a database.
const initialUsers: User[] = [
    { id: 'USR001', name: 'Alex Doe', email: 'alex.doe@example.com', joinDate: '2024-07-01', status: 'Active', wallet: 550.75 },
    { id: 'USR002', name: 'Priya Sharma', email: 'priya.sharma@example.com', joinDate: '2024-07-15', status: 'Active', wallet: 150.00 },
    { id: 'USR003', name: 'Rohan Kumar', email: 'rohan.k@example.com', joinDate: '2024-06-20', status: 'Banned', wallet: 0.00 },
    { id: 'USR004', name: 'Anjali Mehta', email: 'anjali.m@example.com', joinDate: '2024-05-10', status: 'Inactive', wallet: 25.50 },
];

const getStatusBadgeVariant = (status: string) => {
    return status === "Active" ? "default" : status === "Banned" ? "destructive" : "secondary";
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching data on the client side to ensure compatibility with production builds.
    setUsers(initialUsers);
  }, []);

  const handleStatusChange = (userId: string, newStatus: UserStatus) => {
    if (!users) return;
    const updatedUsers = users.map((user) =>
        user.id === userId ? { ...user, status: newStatus } : user
      );
    setUsers(updatedUsers);
    // In a real app, you would also update your backend data source.
    toast({
      title: `User ${newStatus}`,
      description: `User ${userId} has been ${newStatus.toLowerCase()}.`,
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (!users) return;
    const userToDelete = users.find(user => user.id === userId);
    const updatedUsers = users.filter(user => user.id !== userId);
    setUsers(updatedUsers);
    // In a real app, you would also update your backend data source.
    toast({
        title: "User Deleted",
        description: `User account for ${userToDelete?.name} has been deleted.`
    });
  }

  const filteredUsers = users ? users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  if (!users) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">User Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Players</CardTitle>
          <CardDescription>
            View, manage, and take action on player accounts.
          </CardDescription>
          <div className="flex items-center justify-between pt-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users by name or email..." 
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-right">Wallet Balance</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={`https://placehold.co/40x40.png?text=${user.name.charAt(0)}`} data-ai-hint="profile avatar" />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(user.joinDate), 'P')}</TableCell>
                  <TableCell className="text-right font-medium">₹{user.wallet.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Edit Wallet</DropdownMenuItem>
                        {user.status !== "Banned" && (
                            <DropdownMenuItem className="text-yellow-600 focus:text-yellow-500" onClick={() => handleStatusChange(user.id, "Banned")}>
                                Ban User
                            </DropdownMenuItem>
                        )}
                        {user.status === "Banned" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(user.id, "Active")}>
                                Unban User
                            </DropdownMenuItem>
                        )}
                         <DropdownMenuItem className="text-red-600 focus:text-red-500 focus:bg-red-950/50" onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                 <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">No users found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    