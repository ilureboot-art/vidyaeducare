
"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Search, MoreHorizontal, Trash2, Loader2, Users as UsersIcon, GraduationCap, Calendar, Info, RefreshCcw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { useDb } from "@/firebase";
import { collection, doc, updateDoc, deleteDoc, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { StudentProfile } from "@/lib/student-data";

type UserStatus = "Active" | "Banned" | "Inactive";
type UserSummary = {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  status: UserStatus;
  phone?: string;
};

const getStatusBadgeVariant = (status: string) => {
    return status === "Active" ? "default" : status === "Banned" ? "destructive" : "secondary";
}

export default function UserManagementPage() {
  const db = useDb();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserSummary[] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [selectedParent, setSelectedParent] = useState<UserSummary | null>(null);
  const [parentStudents, setParentStudents] = useState<StudentProfile[] | null>(null);
  const [parentWallet, setParentWallet] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  const fetchUsers = useCallback(async (showLoader = true) => {
    if (!db) return;
    if (showLoader) setUsers(null);
    else setIsRefreshing(true);

    try {
        const usersCollection = collection(db, "users");
        const q = query(usersCollection, orderBy("joinDate", "desc"), limit(100));
        const userSnapshot = await getDocs(q);
        
        const userList = userSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as UserSummary));
        
        setUsers(userList);
    } catch (error) {
        console.error("Error fetching users:", error);
        toast({ variant: 'destructive', title: "Sync Error", description: "Could not load user list." });
    } finally {
        setIsRefreshing(false);
    }
  }, [db, toast]);

  useEffect(() => {
    if(db) fetchUsers();
  }, [db, fetchUsers]);

  const viewUserDetails = async (parent: UserSummary) => {
      if (!db) return;
      setSelectedParent(parent);
      setParentStudents(null);
      setParentWallet(null);
      setIsLoadingDetails(true);
      setIsDetailsOpen(true);

      try {
          // PERFORMANCE: Fetch Wallet and Students in parallel only when details are requested
          const studentsQuery = query(collection(db, "students"), where("parentId", "==", parent.id));
          const walletRef = doc(db, "wallets", parent.id);
          
          const [studentsSnap, walletSnap] = await Promise.all([
              getDocs(studentsQuery),
              getDocs(query(collection(db, "wallets"), where("__name__", "==", parent.id)))
          ]);

          const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as StudentProfile));
          const walletBalance = !walletSnap.empty ? walletSnap.docs[0].data().balance : 0;

          setParentStudents(students);
          setParentWallet(walletBalance);
      } catch (e) {
          console.error("Error loading details:", e);
          toast({ variant: 'destructive', title: "Error", description: "Could not load details." });
      } finally {
          setIsLoadingDetails(false);
      }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    if (!db) return;
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { status: newStatus });
        
        setUsers(prev => prev ? prev.map(u => u.id === userId ? { ...u, status: newStatus } : u) : null);
        
        toast({
          title: `User ${newStatus}`,
          description: `User account has been marked as ${newStatus.toLowerCase()}.`,
        });
    } catch (error) {
        console.error("Error changing status:", error);
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update user status.'});
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!db) return;
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

    try {
        await deleteDoc(doc(db, "users", userId));
        setUsers(prev => prev ? prev.filter(u => u.id !== userId) : null);
        toast({ title: "User Deleted", description: "Account removed successfully." });
    } catch(error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete user.' });
    }
  }

  if (!users) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-muted-foreground animate-pulse">Syncing User Database...</p>
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button variant="outline" size="sm" onClick={() => fetchUsers(false)} disabled={isRefreshing}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Registered Users (Parents)</CardTitle>
          <CardDescription>
            Manage parent accounts and access student performance records.
          </CardDescription>
          <div className="pt-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name or email..." 
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Identity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <TableRow key={user.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={`https://picsum.photos/seed/${user.id}/40/40`} data-ai-hint="user avatar" />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold leading-none">{user.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                      {user.phone || 'No Phone'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                      {user.joinDate ? format(new Date(user.joinDate), 'PP') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Control Panel</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => viewUserDetails(user)}>
                            <Info className="mr-2 h-4 w-4 text-blue-500" />
                            View Performance & Wallet
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(user.id, user.status === "Banned" ? "Active" : "Banned")}>
                            {user.status === "Banned" ? "Unban Account" : "Suspend Account"}
                        </DropdownMenuItem>
                         <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 className="mr-2 h-4 w-4"/>
                            Permanently Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                 <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-32">
                        {searchTerm ? "No users match your search." : "No users registered yet."}
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                      <UsersIcon className="text-primary" />
                      Details for {selectedParent?.name}
                  </DialogTitle>
                  <DialogDescription>Overview of student profiles and financial standing.</DialogDescription>
              </DialogHeader>
              
              {isLoadingDetails ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <Loader2 className="animate-spin text-primary" size={32} />
                      <p className="text-sm text-muted-foreground">Fetching deep records...</p>
                  </div>
              ) : (
                  <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                          <Card className="bg-primary/5 border-primary/10">
                              <CardHeader className="py-3 px-4">
                                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Wallet Balance</CardTitle>
                              </CardHeader>
                              <CardContent className="py-0 px-4 pb-4">
                                  <p className="text-2xl font-bold text-primary">₹{parentWallet?.toFixed(2) || '0.00'}</p>
                              </CardContent>
                          </Card>
                          <Card className="bg-muted/30">
                              <CardHeader className="py-3 px-4">
                                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Students Linked</CardTitle>
                              </CardHeader>
                              <CardContent className="py-0 px-4 pb-4">
                                  <p className="text-2xl font-bold">{parentStudents?.length || 0}</p>
                              </CardContent>
                          </Card>
                      </div>

                      <div className="space-y-3">
                          <h3 className="text-sm font-bold flex items-center gap-2">
                              <GraduationCap className="w-4 h-4" /> Enrolled Students
                          </h3>
                          {parentStudents && parentStudents.length > 0 ? (
                              <div className="grid gap-3">
                                  {parentStudents.map(s => (
                                      <div key={s.id} className="p-4 border rounded-xl flex items-center justify-between bg-card hover:shadow-sm transition-shadow">
                                          <div className="flex items-center gap-4">
                                              <Avatar className="h-12 w-12 border-2 border-muted">
                                                  <AvatarImage src={s.avatarUrl} />
                                                  <AvatarFallback>{s.name.charAt(0)}</AvatarFallback>
                                              </Avatar>
                                              <div>
                                                  <p className="font-bold">{s.name}</p>
                                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                      {s.academic.standard} • {s.academic.board}
                                                  </p>
                                              </div>
                                          </div>
                                          <div className="text-right text-xs">
                                              <p className="flex items-center justify-end gap-1 text-muted-foreground">
                                                  <Calendar className="w-3 h-3" /> {s.dob}
                                              </p>
                                              <div className="mt-1 flex items-center justify-end gap-2">
                                                  <Badge variant="outline" className="font-mono text-[10px]">{s.id}</Badge>
                                                  <p className="font-bold text-primary">{s.stats.testsTaken} Tests</p>
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className="text-center py-8 bg-muted/20 rounded-xl border border-dashed">
                                  <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
                              </div>
                          )}
                      </div>
                  </div>
              )}
          </DialogContent>
      </Dialog>
    </div>
  );
}
