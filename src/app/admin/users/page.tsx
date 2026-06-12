"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Search, MoreHorizontal, Trash2, Loader2, Users as UsersIcon, GraduationCap, RefreshCcw, Info, FilterX } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { useDb } from "@/firebase";
import { collection, doc, updateDoc, getDocs, getDoc, query, where, orderBy, limit } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { StudentProfile } from "@/lib/student-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

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
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
        const userSnapshot = await getDocs(q).catch(async (e) => {
             const permissionError = new FirestorePermissionError({
                  path: usersCollection.path,
                  operation: 'list',
              } satisfies SecurityRuleContext);
              errorEmitter.emit('permission-error', permissionError);
              throw e;
        });
        
        const userList = userSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as UserSummary));
        
        setUsers(userList);
    } catch (error) {
        console.error("Fetch Users Error:", error);
        setUsers([]); // Ensure the spinner stops on error
    } finally {
        setIsRefreshing(false);
    }
  }, [db]);

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
          const studentsQuery = query(collection(db, "students"), where("parentId", "==", parent.id));
          const walletRef = doc(db, "wallets", parent.id);
          
          const [studentsSnap, walletSnap] = await Promise.all([
              getDocs(studentsQuery).catch(async (e) => {
                   const permissionError = new FirestorePermissionError({
                        path: 'students',
                        operation: 'list',
                    } satisfies SecurityRuleContext);
                    errorEmitter.emit('permission-error', permissionError);
                    throw e;
              }),
              getDoc(walletRef).catch(async (e) => {
                   const permissionError = new FirestorePermissionError({
                        path: walletRef.path,
                        operation: 'get',
                    } satisfies SecurityRuleContext);
                    errorEmitter.emit('permission-error', permissionError);
                    throw e;
              })
          ]);

          const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as StudentProfile));
          const walletBalance = walletSnap.exists() ? walletSnap.data().balance : 0;

          setParentStudents(students);
          setParentWallet(walletBalance);
      } catch (e) {
          console.error("View Details Error:", e);
      } finally {
          setIsLoadingDetails(false);
      }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    if (!db) return;
    const userDocRef = doc(db, "users", userId);
    const updateData = { status: newStatus };

    updateDoc(userDocRef, updateData)
        .then(() => {
            setUsers(prev => prev ? prev.map(u => u.id === userId ? { ...u, status: newStatus } : u) : null);
            toast({ title: `User ${newStatus}`, description: `Account updated to ${newStatus}.` });
        })
        .catch(async (e) => {
             const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: updateData,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => {
      const matchesSearch = (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
                           (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

  if (users === null) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-muted-foreground animate-pulse font-medium">Syncing User Database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button variant="outline" size="sm" onClick={() => fetchUsers(false)} disabled={isRefreshing}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh List
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Registered Users (Parents)</CardTitle>
          <CardDescription>Manage parent accounts and access linked student records.</CardDescription>
          <div className="pt-4 flex flex-wrap gap-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search name or email..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Banned">Banned</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}>
              <FilterX className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Identity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <TableRow key={user.id} className="group even:bg-muted/40 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={`https://picsum.photos/seed/${user.id}/40/40`} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold leading-none">{user.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={getStatusBadgeVariant(user.status)}>{user.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{user.joinDate ? format(new Date(user.joinDate), 'PP') : 'N/A'}</TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal size={16}/></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => viewUserDetails(user)}><Info size={14} className="mr-2"/> View Records</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(user.id, user.status === "Banned" ? "Active" : "Banned")}>
                            {user.status === "Banned" ? "Unban Account" : "Suspend Account"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No users found matching your search.
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
                  <DialogTitle className="flex items-center gap-2"><UsersIcon className="text-primary" /> Details for {selectedParent?.name}</DialogTitle>
                  <DialogDescription>Full record of linked student profiles and wallet standing.</DialogDescription>
              </DialogHeader>
              
              {isLoadingDetails ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <Loader2 className="animate-spin text-primary" size={32} />
                      <p className="text-sm text-muted-foreground font-medium">Fetching deep records...</p>
                  </div>
              ) : (
                  <div className="space-y-6 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                          <Card className="bg-primary/[0.03] border-primary/10">
                              <CardHeader className="py-3 px-4"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Wallet Balance</CardTitle></CardHeader>
                              <CardContent className="py-0 px-4 pb-4"><p className="text-3xl font-black text-primary">₹{parentWallet?.toFixed(2) || '0.00'}</p></CardContent>
                          </Card>
                          <Card className="bg-muted/30 border-transparent">
                              <CardHeader className="py-3 px-4"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Enrolled Students</CardTitle></CardHeader>
                              <CardContent className="py-0 px-4 pb-4"><p className="text-3xl font-black">{parentStudents?.length || 0}</p></CardContent>
                          </Card>
                      </div>

                      <div className="space-y-3">
                          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><GraduationCap size={14}/> Academic Records</h3>
                          {parentStudents && parentStudents.length > 0 ? (
                              <div className="grid gap-3">
                                  {parentStudents.map(s => (
                                      <div key={s.id} className="p-4 border rounded-xl flex items-center justify-between bg-card hover:shadow-md transition-shadow">
                                          <div className="flex items-center gap-4">
                                              <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                                  <AvatarImage src={s.avatarUrl} />
                                                  <AvatarFallback>{s.name.charAt(0)}</AvatarFallback>
                                              </Avatar>
                                              <div>
                                                  <p className="font-bold leading-none">{s.name}</p>
                                                  <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">{s.academic.standard} • {s.academic.board} Board</p>
                                              </div>
                                          </div>
                                          <div className="text-right">
                                              <p className="font-black text-primary text-sm">{s.stats?.testsTaken || 0} Tests</p>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed">
                                  <p className="text-sm text-muted-foreground font-medium">No students enrolled yet.</p>
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