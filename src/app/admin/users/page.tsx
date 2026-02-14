
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
import { Search, UserPlus, MoreHorizontal, Trash2, Loader2, Users as UsersIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { useDb } from "@/firebase";
import { collection, doc, updateDoc, deleteDoc, getDocs, query, where } from "firebase/firestore";

type UserStatus = "Active" | "Banned" | "Inactive";
type UserWithStats = {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  status: UserStatus;
  wallet?: number;
  studentCount?: number;
};

const getStatusBadgeVariant = (status: string) => {
    return status === "Active" ? "default" : status === "Banned" ? "destructive" : "secondary";
}

export default function UserManagementPage() {
  const db = useDb();
  const [users, setUsers] = useState<UserWithStats[] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  const fetchUsers = async () => {
    if (!db) return;
    const usersCollection = collection(db, "users");
    const userSnapshot = await getDocs(usersCollection);
    
    const userList = await Promise.all(userSnapshot.docs.map(async (userDoc) => {
        const userData = userDoc.data();
        const userId = userDoc.id;
        
        // Fetch wallet balance
        const walletDoc = await getDocs(query(collection(db, "wallets"), where("__name__", "==", userId)));
        const walletBalance = !walletDoc.empty ? walletDoc.docs[0].data().balance : 0;
        
        // Fetch student count
        const studentsQuery = query(collection(db, "students"), where("parentId", "==", userId));
        const studentsSnapshot = await getDocs(studentsQuery);
        
        return { 
            id: userId, 
            ...userData, 
            wallet: walletBalance,
            studentCount: studentsSnapshot.size
        } as UserWithStats;
    }));
    
    setUsers(userList);
  };

  useEffect(() => {
    if(db) fetchUsers();
  }, [db]);

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    if (!users || !db) return;
    
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { status: newStatus });
        fetchUsers();
        toast({
          title: `User ${newStatus}`,
          description: `User ${userId} has been ${newStatus.toLowerCase()}.`,
        });
    } catch (error) {
        console.error("Error changing user status:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not change user status.'});
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!users || !db) return;
    const userToDelete = users.find(user => user.id === userId);
    if (!userToDelete) return;

    try {
        await deleteDoc(doc(db, "users", userId));
        fetchUsers();
        toast({
            title: "User Deleted",
            description: `User account for ${userToDelete.name} has been deleted.`
        });
    } catch(error) {
        console.error("Error deleting user:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete user.' });
    }
  }

  if (!users) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">User Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Players (Parents)</CardTitle>
          <CardDescription>
            View, manage, and track player accounts and their students.
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
            <Button variant="outline" onClick={() => fetchUsers()}>
              Refresh List
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User (Parent)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Students</TableHead>
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
                            <AvatarImage src={`https://picsum.photos/seed/${user.id}/40/40`} data-ai-hint="profile avatar" />
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
                  <TableCell className="text-center">
                    <Badge variant="outline" className="flex items-center gap-1 justify-center w-12 mx-auto">
                        <UsersIcon className="w-3 h-3" />
                        {user.studentCount || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(user.joinDate), 'P')}</TableCell>
                  <TableCell className="text-right font-medium">₹{user.wallet?.toFixed(2) || '0.00'}</TableCell>
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
                        <DropdownMenuItem>View Stats</DropdownMenuItem>
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
                            <Trash2 className="mr-2 h-4 w-4"/>
                            Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                 <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground h-24">No users found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
