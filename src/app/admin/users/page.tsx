
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
import { Search, UserPlus, MoreHorizontal, Trash2, Loader2, Users as UsersIcon, GraduationCap, Calendar, Info } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { useDb } from "@/firebase";
import { collection, doc, updateDoc, deleteDoc, getDocs, query, where } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { StudentProfile } from "@/lib/student-data";

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
  const [selectedParent, setSelectedParent] = useState<UserWithStats | null>(null);
  const [parentStudents, setParentStudents] = useState<StudentProfile[] | null>(null);
  const [isStudentsOpen, setIsStudentsOpen] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
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

  const viewStudents = async (parent: UserWithStats) => {
      if (!db) return;
      setSelectedParent(parent);
      setIsLoadingStudents(true);
      setIsStudentsOpen(true);
      try {
          const q = query(collection(db, "students"), where("parentId", "==", parent.id));
          const snapshot = await getDocs(q);
          const students = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StudentProfile));
          setParentStudents(students);
      } catch (e) {
          toast({ variant: 'destructive', title: "Error", description: "Could not load student list." });
      } finally {
          setIsLoadingStudents(false);
      }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    if (!users || !db) return;
    
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { status: newStatus });
        fetchUsers();
        toast({
          title: `User ${newStatus}`,
          description: `User account has been ${newStatus.toLowerCase()}.`,
        });
    } catch (error) {
        console.error("Error changing user status:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not change user status.'});
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!users || !db) return;
    try {
        await deleteDoc(doc(db, "users", userId));
        fetchUsers();
        toast({ title: "User Deleted", description: "Account removed successfully." });
    } catch(error) {
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
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">User Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Players (Parents)</CardTitle>
          <CardDescription>
            View and manage parent accounts and their enrolled students.
          </CardDescription>
          <div className="flex items-center justify-between pt-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users..." 
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
                <TableHead className="text-right">Wallet</TableHead>
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
                            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" className="h-auto p-1 gap-1" onClick={() => viewStudents(user)}>
                        <Badge variant="outline" className="flex items-center gap-1 justify-center w-12">
                            <UsersIcon className="w-3 h-3" />
                            {user.studentCount || 0}
                        </Badge>
                    </Button>
                  </TableCell>
                  <TableCell className="text-xs">
                      {user.joinDate ? format(new Date(user.joinDate), 'P') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right font-medium">₹{user.wallet?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => viewStudents(user)}>
                            <Info className="mr-2 h-4 w-4" />
                            View Students
                        </DropdownMenuItem>
                        {user.status !== "Banned" && (
                            <DropdownMenuItem className="text-yellow-600" onClick={() => handleStatusChange(user.id, "Banned")}>
                                Ban User
                            </DropdownMenuItem>
                        )}
                        {user.status === "Banned" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(user.id, "Active")}>
                                Unban User
                            </DropdownMenuItem>
                        )}
                         <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 className="mr-2 h-4 w-4"/>
                            Delete Account
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

      <Dialog open={isStudentsOpen} onOpenChange={setIsStudentsOpen}>
          <DialogContent className="max-w-3xl">
              <DialogHeader>
                  <DialogTitle>Students for {selectedParent?.name}</DialogTitle>
                  <DialogDescription>Overview of student profiles associated with this parent account.</DialogDescription>
              </DialogHeader>
              {isLoadingStudents ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
              ) : (
                  <div className="space-y-4">
                      {parentStudents && parentStudents.length > 0 ? parentStudents.map(s => (
                          <div key={s.id} className="p-4 border rounded-lg flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                  <Avatar className="h-12 w-12">
                                      <AvatarImage src={s.avatarUrl} />
                                      <AvatarFallback>{s.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                      <p className="font-bold">{s.name}</p>
                                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                                          <GraduationCap className="w-3 h-3" /> {s.academic.standard} | {s.academic.board}
                                      </p>
                                  </div>
                              </div>
                              <div className="text-right text-xs">
                                  <p className="flex items-center justify-end gap-1"><Calendar className="w-3 h-3" /> DOB: {s.dob}</p>
                                  <p className="font-medium mt-1">Tests Taken: {s.stats.testsTaken}</p>
                              </div>
                          </div>
                      )) : <p className="text-center py-8 text-muted-foreground">No students enrolled yet.</p>}
                  </div>
              )}
          </DialogContent>
      </Dialog>
    </div>
  );
}
