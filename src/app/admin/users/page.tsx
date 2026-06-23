
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, MoreHorizontal, Loader2, Users as UsersIcon, GraduationCap, RefreshCcw, Info, FilterX, ShieldCheck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { useDb, useAuth } from "@/firebase";
import { collection, doc, updateDoc, getDocs, getDoc, query, where, orderBy, limit, onSnapshot, deleteField, addDoc } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { StudentProfile } from "@/lib/student-data";
import { type StoreConfig } from "@/lib/store-config";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { cn } from "@/lib/utils";

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
  const { user, isAdmin, isResolved } = useAuth();
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

  const [parentUserData, setParentUserData] = useState<any>(null);
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);

  const [isOverrideMockLimit, setIsOverrideMockLimit] = useState(false);
  const [mockLimitVal, setMockLimitVal] = useState(3);

  const [isOverrideCommission, setIsOverrideCommission] = useState(false);
  const [commissionVal, setCommissionVal] = useState(10);

  const [isOverrideDiscount, setIsOverrideDiscount] = useState(false);
  const [discountVal, setDiscountVal] = useState(10);

  const [isSavingBenefits, setIsSavingBenefits] = useState(false);
  
  useEffect(() => {
    // CRITICAL: Ensure we only establish the listener once the admin role is verified
    if (!db || !isResolved || !isAdmin) return;

    const usersCollection = collection(db, "users");
    const q = query(usersCollection, orderBy("joinDate", "desc"), limit(200));
    
    setIsRefreshing(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const userList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as UserSummary));
        setUsers(userList);
        setIsRefreshing(false);
    }, async (error) => {
        console.error("User sync error:", error.code);
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: usersCollection.path,
                operation: 'list',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        }
        setUsers([]);
        setIsRefreshing(false);
    });

    return () => unsubscribe();
  }, [db, isResolved, isAdmin]);

  useEffect(() => {
    if (!db || !isResolved || !isAdmin) return;
    getDoc(doc(db, "configs", "store")).then((snap) => {
      if (snap.exists()) {
        setStoreConfig(snap.data() as StoreConfig);
      }
    }).catch(err => console.error("Error loading store config for defaults:", err));
  }, [db, isResolved, isAdmin]);

  const viewUserDetails = async (parent: UserSummary) => {
      if (!db) return;
      setSelectedParent(parent);
      setParentStudents(null);
      setParentWallet(null);
      setParentUserData(null);
      setIsLoadingDetails(true);
      setIsDetailsOpen(true);

      try {
          const studentsQuery = query(collection(db, "students"), where("parentId", "==", parent.id));
          const walletRef = doc(db, "wallets", parent.id);
          const userDocRef = doc(db, "users", parent.id);
          
          const [studentsSnap, walletSnap, userSnap] = await Promise.all([
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
              }),
              getDoc(userDocRef).catch(async (e) => {
                   const permissionError = new FirestorePermissionError({
                        path: userDocRef.path,
                        operation: 'get',
                    } satisfies SecurityRuleContext);
                    errorEmitter.emit('permission-error', permissionError);
                    throw e;
              })
          ]);

          const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as StudentProfile));
          const walletBalance = walletSnap.exists() ? walletSnap.data().balance : 0;
          const parentData = userSnap.exists() ? userSnap.data() : null;

          setParentStudents(students);
          setParentWallet(walletBalance);
          setParentUserData(parentData);

          if (parentData) {
              if (typeof parentData.mock_test_limit === 'number') {
                  setIsOverrideMockLimit(true);
                  setMockLimitVal(parentData.mock_test_limit);
              } else {
                  setIsOverrideMockLimit(false);
                  setMockLimitVal(storeConfig?.defaultMockTestLimit ?? 3);
              }
              
              if (typeof parentData.commission_rate === 'number') {
                  setIsOverrideCommission(true);
                  setCommissionVal(parentData.commission_rate);
              } else {
                  setIsOverrideCommission(false);
                  setCommissionVal(parentData.purchasedMockTest === true ? (storeConfig?.ibaCommissionRate ?? 10) : (storeConfig?.freeIbaCommissionRate ?? 5));
              }
              
              if (typeof parentData.discount_rate === 'number') {
                  setIsOverrideDiscount(true);
                  setDiscountVal(parentData.discount_rate);
              } else {
                  setIsOverrideDiscount(false);
                  setDiscountVal(10);
              }
          }
      } catch (e) {
          console.error("View Details Error:", e);
      } finally {
          setIsLoadingDetails(false);
      }
  };

  const handleSaveBenefits = async () => {
      if (!db || !selectedParent || !user) return;
      setIsSavingBenefits(true);
      
      const userDocRef = doc(db, "users", selectedParent.id);
      
      // Validation limits: rates cannot exceed 100%
      const finalMockLimit = isOverrideMockLimit ? Math.max(0, Math.floor(Number(mockLimitVal))) : null;
      const finalCommission = isOverrideCommission ? Math.min(100, Math.max(0, Number(commissionVal))) : null;
      const finalDiscount = isOverrideDiscount ? Math.min(100, Math.max(0, Number(discountVal))) : null;

      const updateData: any = {};
      updateData.mock_test_limit = isOverrideMockLimit ? finalMockLimit : deleteField();
      updateData.commission_rate = isOverrideCommission ? finalCommission : deleteField();
      updateData.discount_rate = isOverrideDiscount ? finalDiscount : deleteField();

      try {
          await updateDoc(userDocRef, updateData).catch(async (e) => {
              const permissionError = new FirestorePermissionError({
                  path: userDocRef.path,
                  operation: 'update',
                  requestResourceData: updateData,
              } satisfies SecurityRuleContext);
              errorEmitter.emit('permission-error', permissionError);
              throw e;
          });

          // Write audit log with timestamp & admin ID
          const auditLogRef = collection(db, "auditLogs");
          await addDoc(auditLogRef, {
              adminId: user.uid,
              adminEmail: user.email || "",
              targetUserId: selectedParent.id,
              targetUserName: selectedParent.name,
              action: "UPDATE_USER_BENEFITS",
              timestamp: new Date().toISOString(),
              changes: {
                  mock_test_limit: isOverrideMockLimit ? finalMockLimit : "Default",
                  commission_rate: isOverrideCommission ? finalCommission : "Default",
                  discount_rate: isOverrideDiscount ? finalDiscount : "Default"
              }
          });

          toast({ title: "Privileges Saved!", description: "User specific benefits have been updated and logged." });
          
          setParentUserData((prev: any) => {
              if (!prev) return null;
              const next = { ...prev };
              if (isOverrideMockLimit) next.mock_test_limit = finalMockLimit;
              else delete next.mock_test_limit;
              if (isOverrideCommission) next.commission_rate = finalCommission;
              else delete next.commission_rate;
              if (isOverrideDiscount) next.discount_rate = finalDiscount;
              else delete next.discount_rate;
              return next;
          });
      } catch (err) {
          console.error("Save privileges error:", err);
          toast({ variant: 'destructive', title: "Save Failed", description: "Could not save user privileges." });
      } finally {
          setIsSavingBenefits(false);
      }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    if (!db) return;
    const userDocRef = doc(db, "users", userId);
    const updateData = { status: newStatus };

    updateDoc(userDocRef, updateData)
        .then(() => {
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
        <Button variant="outline" size="sm" onClick={() => window.location.reload()} disabled={isRefreshing}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh List
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Registered Users (Parents)</CardTitle>
          <CardDescription>Manage parent accounts and access linked student records. Showing latest 200 registrations.</CardDescription>
          <div className="pt-4 flex flex-wrap gap-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                  <TableCell className="text-xs text-muted-foreground">
                    {user.joinDate ? (
                        <div className="flex flex-col">
                            <span>{format(new Date(user.joinDate), 'PP')}</span>
                            <span className="text-[10px] opacity-60">{format(new Date(user.joinDate), 'p')}</span>
                        </div>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal size={16}/></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => viewUserDetails(user)}><Info size={14} className="mr-2"/> View Records</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(user.id, user.status === "Banned" ? "Active" : "Banned")}>
                                {user.status === "Banned" ? "Unban Account" : "Suspend Account"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
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
                                  {parentStudents.map((s, index) => (
                                      <div key={s.id} className={cn(
                                          "p-4 border rounded-xl flex items-center justify-between hover:shadow-md transition-all",
                                          index % 2 === 0 ? "bg-card" : "bg-muted/40"
                                      )}>
                                          <div className="flex items-center gap-4">
                                              <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                                  <AvatarImage src={s.avatarUrl} />
                                                  <AvatarFallback className="font-bold">{s.name.charAt(0)}</AvatarFallback>
                                              </Avatar>
                                              <div>
                                                  <p className="font-bold leading-none">{s.name}</p>
                                                  <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">{s.academic.standard} Standard • {s.academic.board} Board</p>
                                              </div>
                                          </div>
                                          <div className="text-right">
                                              <p className="font-black text-primary text-sm">{s.stats?.testsTaken || 0} Sessions</p>
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

                      <div className="space-y-4 border-t pt-6">
                          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                              <ShieldCheck size={14} className="text-primary"/> User-Specific Benefits & Privileges
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Mock Test Limit Override */}
                              <Card className="p-4 space-y-4 border shadow-sm">
                                  <div className="flex items-center justify-between">
                                      <Label className="font-bold text-xs uppercase text-muted-foreground">Mock Test Limit</Label>
                                      <Switch 
                                        id="override-mock-limit"
                                        checked={isOverrideMockLimit} 
                                        onCheckedChange={(checked) => {
                                            setIsOverrideMockLimit(checked);
                                            if (checked && !mockLimitVal) {
                                                setMockLimitVal(3);
                                            }
                                        }} 
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="mock-limit-input" className="text-[10px] font-bold text-primary uppercase">Free Tests Count</Label>
                                      <Input 
                                        id="mock-limit-input"
                                        type="number" 
                                        disabled={!isOverrideMockLimit}
                                        value={isOverrideMockLimit ? mockLimitVal : (storeConfig?.defaultMockTestLimit ?? 3)}
                                        onChange={(e) => setMockLimitVal(Math.max(0, parseInt(e.target.value) || 0))}
                                      />
                                      <p className="text-[9px] text-muted-foreground italic">
                                          {isOverrideMockLimit ? "Overriding global default count" : `Default: ${storeConfig?.defaultMockTestLimit ?? 3} tests`}
                                      </p>
                                  </div>
                              </Card>

                              {/* Commission Rate Override */}
                              <Card className="p-4 space-y-4 border shadow-sm">
                                  <div className="flex items-center justify-between">
                                      <Label className="font-bold text-xs uppercase text-muted-foreground">Commission Rate</Label>
                                      <Switch 
                                        id="override-commission-rate"
                                        checked={isOverrideCommission} 
                                        onCheckedChange={(checked) => {
                                            setIsOverrideCommission(checked);
                                            if (checked && !commissionVal) {
                                                setCommissionVal(parentUserData?.purchasedMockTest === true ? 10 : 5);
                                            }
                                        }} 
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="commission-rate-input" className="text-[10px] font-bold text-primary uppercase">Commission (%)</Label>
                                      <Input 
                                        id="commission-rate-input"
                                        type="number" 
                                        disabled={!isOverrideCommission}
                                        value={isOverrideCommission ? commissionVal : (parentUserData?.purchasedMockTest === true ? (storeConfig?.ibaCommissionRate ?? 10) : (storeConfig?.freeIbaCommissionRate ?? 5))}
                                        onChange={(e) => setCommissionVal(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                      />
                                      <p className="text-[9px] text-muted-foreground italic">
                                          {isOverrideCommission ? "Overriding global default rate" : `Default: ${parentUserData?.purchasedMockTest === true ? (storeConfig?.ibaCommissionRate ?? 10) : (storeConfig?.freeIbaCommissionRate ?? 5)}%`}
                                      </p>
                                  </div>
                              </Card>

                              {/* Discount Rate Override */}
                              <Card className="p-4 space-y-4 border shadow-sm">
                                  <div className="flex items-center justify-between">
                                      <Label className="font-bold text-xs uppercase text-muted-foreground">Discount Rate</Label>
                                      <Switch 
                                        id="override-discount-rate"
                                        checked={isOverrideDiscount} 
                                        onCheckedChange={(checked) => {
                                            setIsOverrideDiscount(checked);
                                            if (checked && !discountVal) {
                                                setDiscountVal(10);
                                            }
                                        }} 
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="discount-rate-input" className="text-[10px] font-bold text-primary uppercase">Special Discount (%)</Label>
                                      <Input 
                                        id="discount-rate-input"
                                        type="number" 
                                        disabled={!isOverrideDiscount}
                                        value={isOverrideDiscount ? discountVal : 0}
                                        onChange={(e) => setDiscountVal(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                      />
                                      <p className="text-[9px] text-muted-foreground italic">
                                          {isOverrideDiscount ? "Overriding default package rate" : "Default: Package Special Discount"}
                                      </p>
                                  </div>
                              </Card>
                          </div>
                          
                          <div className="flex justify-end pt-2">
                              <Button 
                                onClick={handleSaveBenefits} 
                                disabled={isSavingBenefits}
                                className="font-black bg-primary text-white"
                              >
                                  {isSavingBenefits ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : null}
                                  Save Benefits & Privileges
                              </Button>
                          </div>
                      </div>
                  </div>
              )}
          </DialogContent>
      </Dialog>
    </div>
  );
}
