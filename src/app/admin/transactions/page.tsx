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
import { Search, Download, ArrowUpRight, ArrowDownLeft, Loader2, Calendar as CalendarIcon, FilterX, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type Transaction } from "@/lib/user-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format, startOfDay, endOfDay } from "date-fns";
import { collection, getDocs, doc, runTransaction, Timestamp, orderBy, query, serverTimestamp } from "firebase/firestore";
import { useDb } from "@/firebase";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import Papa from "papaparse";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const getStatusBadgeVariant = (status: string) => {
    switch ((status || "").toLowerCase()) {
        case "completed":
            return "default";
        case "pending":
            return "secondary";
        case "rejected":
            return "destructive";
        default:
            return "outline";
    }
}

const getAdminTransactionStyle = (tx: Transaction) => {
    const typeLower = (tx.type || "").toLowerCase();
    const descLower = (tx.description || "").toLowerCase();
    
    const isCredit = typeLower === 'purchase' || (typeLower === 'deposit' && descLower.includes('revenue'));
    const isDebit = typeLower === 'withdrawal' || descLower.includes('commission');
    
    if (isCredit) {
        return {
            icon: <ArrowDownLeft className="w-4 h-4 text-green-500" />,
            colorClass: "text-green-600 font-semibold",
            prefix: "+"
        };
    }
    if (isDebit) {
        return {
            icon: <ArrowUpRight className="w-4 h-4 text-red-500" />,
            colorClass: "text-red-600 font-semibold",
            prefix: "-"
        };
    }
    // Student Fund Deposit
    return {
        icon: <ArrowDownLeft className="w-4 h-4 text-blue-500" />,
        colorClass: "text-blue-600",
        prefix: ""
    };
}

export default function TransactionsPage() {
  const { toast } = useToast();
  const db = useDb();

  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit' | 'student_deposit'>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [utrDialogOpen, setUtrDialogOpen] = useState(false);
  const [selectedTxForUtr, setSelectedTxForUtr] = useState<string | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  
  const fetchTransactions = useCallback(async (manual = false) => {
    if (!db) return;
    if (manual) setIsRefreshing(true);
    else setTransactions(null);

    const txsCollectionRef = collection(db, "transactions");
    const q = query(txsCollectionRef, orderBy("date", "desc"));
    
    try {
        const querySnapshot = await getDocs(q).catch(async (e) => {
             const permissionError = new FirestorePermissionError({
                  path: txsCollectionRef.path,
                  operation: 'list',
              } satisfies SecurityRuleContext);
              errorEmitter.emit('permission-error', permissionError);
              throw e;
        });
        
        const txs = querySnapshot.docs.map(doc => {
            const data = doc.data();
            let dateStr;
            try {
                if (data.date instanceof Timestamp) {
                    dateStr = data.date.toDate().toISOString();
                } else if (data.date && typeof data.date === 'object' && 'seconds' in data.date) {
                    dateStr = new Date(data.date.seconds * 1000).toISOString();
                } else {
                    dateStr = data.date || new Date().toISOString();
                }
            } catch (e) {
                dateStr = new Date().toISOString();
            }

            return { id: doc.id, ...data, date: dateStr } as Transaction;
        });
        setTransactions(txs);
    } catch (e) {
        console.error("Fetch Transactions Error:", e);
        setTransactions([]); 
    } finally {
        if (manual) setIsRefreshing(false);
    }
  }, [db]);
  
  useEffect(() => {
    if(db) fetchTransactions();
  }, [db, fetchTransactions]);


  const handleTransactionStatus = async (id: string, newStatus: "Completed" | "Rejected", referenceId?: string) => {
    if (!transactions || !db) return;

    const txToUpdate = transactions.find(tx => tx.id === id);
    if (!txToUpdate || txToUpdate.status !== "Pending") {
        toast({ title: "Action not allowed", description: "This transaction has already been processed."});
        return;
    }

    const txDocRef = doc(db, "transactions", id);

    try {
        await runTransaction(db, async (transaction) => {
            const userWalletRef = txToUpdate.user ? doc(db, "wallets", txToUpdate.user) : null;
            let userWalletDoc = null;
            
            if (userWalletRef) {
                userWalletDoc = await transaction.get(userWalletRef);
            }

            if (userWalletDoc && userWalletDoc.exists()) {
                const walletData = userWalletDoc.data();
                
                if (newStatus === 'Completed') {
                    if (txToUpdate.type === 'deposit') {
                        const newBalance = (walletData.balance || 0) + txToUpdate.amount;
                        transaction.update(userWalletRef!, { balance: newBalance });
                    } else if (txToUpdate.type === 'withdrawal') {
                        const newBalance = (walletData.balance || 0) - Math.abs(txToUpdate.amount);
                        if (newBalance < 200) {
                            throw new Error("Student has insufficient balance to complete this withdrawal.");
                        }
                        transaction.update(userWalletRef!, { balance: newBalance });
                    }
                }
            }
            
            transaction.update(txDocRef, { 
                status: newStatus,
                ...(referenceId ? { referenceId } : {})
            });

            if (txToUpdate.user) {
                const notificationRef = doc(collection(db, "notifications"));
                const notificationType = txToUpdate.type === 'deposit' 
                    ? (newStatus === 'Completed' ? 'deposit_received' : 'deposit_rejected')
                    : (newStatus === 'Completed' ? 'withdrawal_approved' : 'withdrawal_rejected');
                
                const amountStr = `₹${Math.abs(txToUpdate.amount).toFixed(2)}`;
                const msg = newStatus === 'Completed'
                    ? `Your ${txToUpdate.type} request of ${amountStr} was approved.`
                    : `Your ${txToUpdate.type} request of ${amountStr} was rejected.`;

                transaction.set(notificationRef, {
                    userId: txToUpdate.user,
                    type: notificationType,
                    message: msg,
                    status: 'unread',
                    timestamp: serverTimestamp(),
                });
            }
        }).catch(async (e) => {
             const permissionError = new FirestorePermissionError({
                path: txDocRef.path,
                operation: 'update',
                requestResourceData: { status: newStatus },
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
            throw e;
        });

        toast({ title: "Transaction Updated", description: `Transaction marked as ${newStatus}.` });
        fetchTransactions(true);
    } catch(error: any) {
        console.error("Transaction Update Error:", error);
        toast({ variant: "destructive", title: "Action Failed", description: error.message || "Failed to update transaction status." });
    }
  };

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(
        (tx) => {
          const description = tx.description || "";
          const userId = tx.user || "";
          const id = String(tx.id || "");
          
          const searchTermMatch = userId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 description.toLowerCase().includes(searchTerm.toLowerCase());
          
          const statusMatch = statusFilter === 'all' || (tx.status || "").toLowerCase() === statusFilter;
          
          let typeMatch = false;
          const typeLower = (tx.type || "").toLowerCase();
          const descLower = (tx.description || "").toLowerCase();

          if (typeFilter === 'all') {
              typeMatch = true;
          } else if (typeFilter === 'credit') {
              typeMatch = typeLower === 'purchase' || (typeLower === 'deposit' && descLower.includes('revenue'));
          } else if (typeFilter === 'debit') {
              typeMatch = typeLower === 'withdrawal' || descLower.includes('commission');
          } else if (typeFilter === 'student_deposit') {
              typeMatch = typeLower === 'deposit' && !descLower.includes('revenue') && !descLower.includes('commission');
          }
          
          const txDate = new Date(tx.date);
          const dateMatch = (!startDate || txDate >= startOfDay(startDate)) && (!endDate || txDate <= endOfDay(endDate));
          
          return searchTermMatch && statusMatch && typeMatch && dateMatch;
        }
      );
  }, [transactions, searchTerm, statusFilter, typeFilter, startDate, endDate]);

  const filteredTotals = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => {
        if (tx.status === 'Completed') {
            const typeLower = (tx.type || "").toLowerCase();

            if (typeLower === 'purchase') {
                acc.deposits += Math.abs(tx.amount);
            } else if (typeLower === 'withdrawal') {
                acc.withdrawals += Math.abs(tx.amount);
            }
        }
        return acc;
    }, { deposits: 0, withdrawals: 0 });
  }, [filteredTransactions]);

  const handleExportCSV = () => {
    if (!filteredTransactions.length) {
        toast({ variant: "destructive", title: "No Data", description: "There are no transactions to export." });
        return;
    }
    
    const csvData = filteredTransactions.map(tx => ({
      'User ID': tx.user || 'System',
      'Description': tx.description,
      'Transaction ID': tx.id,
      'Date': format(new Date(tx.date), 'PPP p'),
      'Status': tx.status,
      'Amount': tx.amount,
      'Type': tx.type,
      'Reference ID': tx.referenceId || ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `admin_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "Export Complete", description: "Report downloaded." });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter('all');
    setTypeFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  if (transactions === null) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-muted-foreground animate-pulse font-medium">Syncing Global Ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">Transactions Management</h1>
          <Button variant="outline" size="sm" onClick={() => fetchTransactions(true)} disabled={isRefreshing}>
              <RefreshCcw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh Data
          </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-green-500/[0.03] border-green-500/20 shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest text-green-600/70">Total Inflow (Completed)</CardTitle>
                      <p className="text-2xl font-black text-green-600">{formatCurrency(filteredTotals.deposits)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                      <ArrowDownLeft size={24}/>
                  </div>
              </CardHeader>
              <div className="h-1 bg-green-500/10 w-full" />
          </Card>
          <Card className="bg-red-500/[0.03] border-red-500/20 shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest text-red-600/70">Total Outflow (Completed)</CardTitle>
                      <p className="text-2xl font-black text-red-600">{formatCurrency(filteredTotals.withdrawals)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-red-50/10 flex items-center justify-center text-red-600">
                      <ArrowUpRight size={24}/>
                  </div>
              </CardHeader>
              <div className="h-1 bg-red-50/10 w-full" />
          </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
                <CardTitle>History Logs</CardTitle>
                <CardDescription>Comprehensive log of all financial events.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
                <FilterX className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>
          <div className="flex flex-col space-y-4 pt-4">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search user, ID or description..." 
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by Flow" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Transactions</SelectItem>
                            <SelectItem value="credit">Admin Credits (Revenue)</SelectItem>
                            <SelectItem value="debit">Admin Debits (Withdrawals)</SelectItem>
                            <SelectItem value="student_deposit">Student Fund Deposits</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t pt-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">From:</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className={cn("w-[160px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "PP") : "Pick a date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">To:</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className={cn("w-[160px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "PP") : "Pick a date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => {
                const style = getAdminTransactionStyle(tx);
                return (
                  <TableRow key={tx.id} className="even:bg-muted/40 transition-colors group">
                    <TableCell className="font-medium text-xs font-mono">{tx.user?.substring(0, 8) || 'System'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                          {style.icon}
                          <span className="text-xs max-w-[150px] truncate">{tx.description}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground font-mono">
                      {String(tx.id).substring(0, 6)}...
                    </TableCell>
                    <TableCell className="text-xs">{format(new Date(tx.date), 'P')}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(tx.status)} className="text-[9px] py-0 h-5">
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn("text-right font-medium text-xs", style.colorClass)}>
                      {style.prefix} ₹{Math.abs(tx.amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      {tx.status === "Pending" && (
                          <div className="flex gap-1 justify-center">
                              <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-green-600 hover:text-green-700 px-2 text-[10px]"
                                  onClick={() => {
                                      if (tx.type === "withdrawal") {
                                          setSelectedTxForUtr(String(tx.id));
                                          setUtrNumber("");
                                          setUtrDialogOpen(true);
                                      } else {
                                          handleTransactionStatus(String(tx.id), "Completed");
                                      }
                                  }}
                              >
                                  Approve
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 text-red-600 hover:text-red-700 px-2 text-[10px]" onClick={() => handleTransactionStatus(String(tx.id), "Rejected")}>Reject</Button>
                          </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredTransactions.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground h-24">No transactions match your current filters.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={utrDialogOpen} onOpenChange={setUtrDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enter Payment UTR / Reference ID</DialogTitle>
            <DialogDescription>
              To approve this withdrawal, please enter the transaction UTR or Reference ID. The user's wallet will be debited immediately upon approval.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="utr" className="text-right">
                UTR No.
              </Label>
              <Input
                id="utr"
                placeholder="e.g., 612345678901"
                className="col-span-3"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUtrDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!utrNumber.trim()}
              onClick={() => {
                if (selectedTxForUtr) {
                  handleTransactionStatus(selectedTxForUtr, "Completed", utrNumber.trim());
                  setUtrDialogOpen(false);
                }
              }}
            >
              Approve & Debit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}