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
import { Search, Download, ArrowUpRight, ArrowDownLeft, Loader2, Calendar as CalendarIcon, FilterX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type Transaction } from "@/lib/user-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format, startOfDay, endOfDay } from "date-fns";
import { collection, getDocs, doc, runTransaction, Timestamp, orderBy, query } from "firebase/firestore";
import { useDb } from "@/firebase";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import Papa from "papaparse";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

const getStatusBadgeVariant = (status: string) => {
    switch (status) {
        case "Completed":
            return "default";
        case "Pending":
            return "secondary";
        case "Rejected":
            return "destructive";
        default:
            return "outline";
    }
}

const getTypeIcon = (type: string, amount: number) => {
    if (type.toLowerCase().includes("withdrawal") || type.toLowerCase().includes("purchase") || amount < 0) {
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
    }
    return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
}

export default function TransactionsPage() {
  const { toast } = useToast();
  const db = useDb();

  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  const fetchTransactions = useCallback(async () => {
    if (!db) return;
    setTransactions(null);
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
            const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
            return { id: doc.id, ...data, date } as Transaction;
        });
        setTransactions(txs);
    } catch (e) {
        console.error("Fetch Transactions Error:", e);
    }
  }, [db]);
  
  useEffect(() => {
    if(db) fetchTransactions();
  }, [db, fetchTransactions]);


  const handleTransactionStatus = async (id: string, newStatus: "Completed" | "Rejected") => {
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
                    }
                } else if (newStatus === 'Rejected') {
                    if (txToUpdate.type === 'withdrawal') {
                        const newBalance = (walletData.balance || 0) - txToUpdate.amount; 
                        transaction.update(userWalletRef!, { balance: newBalance });
                    }
                }
            }
            transaction.update(txDocRef, { status: newStatus });
        }).catch(async (e) => {
             const permissionError = new FirestorePermissionError({
                path: txDocRef.path,
                operation: 'update',
                requestResourceData: { status: newStatus },
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
            throw e;
        });

        toast({
          title: "Transaction Updated",
          description: `Transaction ${id} has been marked as ${newStatus}.`,
        });
        
        fetchTransactions();

    } catch(error) {
        console.error("Transaction Update Error:", error);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions?.filter(
        (tx) => {
          const searchTermMatch = tx.user?.toLowerCase().includes(searchTerm.toLowerCase()) || String(tx.id).toLowerCase().includes(searchTerm.toLowerCase());
          const statusMatch = statusFilter === 'all' || tx.status.toLowerCase() === statusFilter;
          const typeMatch = typeFilter === 'all' || (typeFilter === 'deposit' && tx.amount >= 0) || (typeFilter === 'withdrawal' && tx.amount < 0);
          
          const txDate = new Date(tx.date);
          const dateMatch = (!startDate || txDate >= startOfDay(startDate)) && (!endDate || txDate <= endOfDay(endDate));
          
          return searchTermMatch && statusMatch && typeMatch && dateMatch;
        }
      ) || [];
  }, [transactions, searchTerm, statusFilter, typeFilter, startDate, endDate]);

  const filteredTotals = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => {
        if (tx.amount >= 0) acc.deposits += tx.amount;
        else acc.withdrawals += Math.abs(tx.amount);
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
    link.setAttribute('download', `admin_transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "Export Complete", description: "Transaction report has been downloaded." });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter('all');
    setTypeFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  if (!transactions) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Transactions</h1>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-green-500/[0.03] border-green-500/20 shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest text-green-600/70">Total Inflow (Filtered)</CardTitle>
                      <p className="text-2xl font-black text-green-600">₹{formatCurrency(filteredTotals.deposits)}</p>
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
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest text-red-600/70">Total Outflow (Filtered)</CardTitle>
                      <p className="text-2xl font-black text-red-600">₹{formatCurrency(filteredTotals.withdrawals)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600">
                      <ArrowUpRight size={24}/>
                  </div>
              </CardHeader>
              <div className="h-1 bg-red-500/10 w-full" />
          </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>View and manage all financial transactions within the app.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
                <FilterX className="mr-2 h-4 w-4" /> Reset Filters
            </Button>
          </div>
          <div className="flex flex-col space-y-4 pt-4">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by user or ID..." 
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="deposit">Deposits</SelectItem>
                            <SelectItem value="withdrawal">Withdrawals</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
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
                <TableHead>Type</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium text-xs font-mono">{tx.user || 'System'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        {getTypeIcon(tx.type, tx.amount)}
                        <span className="text-xs">{tx.description}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[10px] text-muted-foreground font-mono">
                    {typeof tx.id === 'string' && tx.id.length > 10 ? tx.id.substring(0, 10) + '...' : tx.id}
                  </TableCell>
                  <TableCell className="text-xs">{format(new Date(tx.date), 'P')}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(tx.status)} className="text-[10px] py-0 h-5">
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-xs">₹{formatCurrency(Math.abs(tx.amount))}</TableCell>
                  <TableCell className="text-center">
                    {tx.status === "Pending" && (
                        <div className="flex gap-1 justify-center">
                            <Button variant="ghost" size="sm" className="h-7 text-green-600 hover:text-green-700 px-2 text-[10px]" onClick={() => handleTransactionStatus(String(tx.id), "Completed")}>Approve</Button>
                            <Button variant="ghost" size="sm" className="h-7 text-red-600 hover:text-red-700 px-2 text-[10px]" onClick={() => handleTransactionStatus(String(tx.id), "Rejected")}>Reject</Button>
                        </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredTransactions.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          No transactions found matching your criteria.
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
