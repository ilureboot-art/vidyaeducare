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
import { Search, Download, ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type Transaction } from "@/lib/user-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { collection, getDocs, doc, updateDoc, writeBatch, getDoc, runTransaction, Timestamp, onSnapshot, orderBy, query } from "firebase/firestore";
import { useDb } from "@/firebase";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import Papa from "papaparse";

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

  const filteredTransactions = transactions?.filter(
    (tx) => {
      const searchTermMatch = tx.user?.toLowerCase().includes(searchTerm.toLowerCase()) || String(tx.id).toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'all' || tx.status.toLowerCase() === statusFilter;
      const typeMatch = typeFilter === 'all' || (typeFilter === 'deposit' && tx.amount >= 0) || (typeFilter === 'withdrawal' && tx.amount < 0);
      return searchTermMatch && statusMatch && typeMatch;
    }
  ) || [];

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
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            View and manage all financial transactions within the app.
          </CardDescription>
          <div className="flex flex-col md:flex-row items-center justify-between pt-4 gap-4">
            <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by user or transaction ID..." 
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="space-y-2">
                <Label htmlFor="type-filter" className="sr-only">Filter by Type</Label>
                <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
                    <SelectTrigger id="type-filter">
                        <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="deposit">Deposits</SelectItem>
                        <SelectItem value="withdrawal">Withdrawals</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status-filter" className="sr-only">Filter by Status</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                    <SelectTrigger id="status-filter">
                        <SelectValue placeholder="Select status..." />
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
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
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
                  <TableCell className="text-right font-medium text-xs">₹{Math.abs(tx.amount).toFixed(2)}</TableCell>
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
