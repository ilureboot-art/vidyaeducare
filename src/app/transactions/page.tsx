
"use client";

import { useState, useEffect, useMemo } from "react";
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
import type { Transaction } from "@/lib/user-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format, startOfDay, endOfDay } from "date-fns";
import { useAuth, useDb } from "@/firebase";
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserLayout from "@/components/UserLayout";
import Papa from "papaparse";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
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

const getTypeIcon = (type: string, amount: number) => {
    if (type.toLowerCase().includes("withdrawal") || type.toLowerCase().includes("purchase") || amount < 0) {
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
    }
    return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
}

function TransactionsPageContent() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const db = useDb();
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  useEffect(() => {
    if (user && db) {
        const txsRef = collection(db, "transactions");
        const q = query(txsRef, where("user", "==", user.uid), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const txs = querySnapshot.docs.map(doc => {
                const data = doc.data();
                const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
                return { id: doc.id, ...data, date } as Transaction;
            });
            setTransactions(txs);
        });
        return () => unsubscribe();
    }
  }, [user, db]);

  const filteredTransactions = useMemo(() => {
    return transactions?.filter(
        (tx) => {
          const searchTermMatch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) || String(tx.id).toLowerCase().includes(searchTerm.toLowerCase());
          const statusMatch = statusFilter === 'all' || tx.status.toLowerCase() === statusFilter;
          const typeMatch = typeFilter === 'all' || (typeFilter === 'deposit' && tx.amount >= 0) || (typeFilter === 'withdrawal' && tx.amount < 0);
          
          const txDate = new Date(tx.date);
          const dateMatch = (!startDate || txDate >= startOfDay(startDate)) && (!endDate || txDate <= endOfDay(endDate));
          
          return searchTermMatch && statusMatch && typeMatch && dateMatch;
        }
      ) || [];
  }, [transactions, searchTerm, statusFilter, typeFilter, startDate, endDate]);

  const handleExportCSV = () => {
    if (!filteredTransactions.length) {
        toast({ variant: "destructive", title: "No Data", description: "There are no transactions to export." });
        return;
    }
    
    const csvData = filteredTransactions.map(tx => ({
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
    link.setAttribute('download', `my_transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "Export Complete", description: "Your transaction history has been downloaded." });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter('all');
    setTypeFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  if (authLoading || !transactions) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>View all financial transactions associated with your account.</CardDescription>
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
                        placeholder="Search by description or ID..." 
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
                <TableHead>Description</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        {getTypeIcon(tx.type, tx.amount)}
                        <span>{tx.description}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {tx.id}
                    {tx.referenceId && <div className="text-ellipsis overflow-hidden">Ref: {tx.referenceId}</div>}
                  </TableCell>
                  <TableCell>{format(new Date(tx.date), 'P')}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(tx.status)}>
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">₹{Math.abs(tx.amount).toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {filteredTransactions.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No transactions found for the selected criteria.
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

export default function TransactionsPage() {
    return (
        <ProtectedRoute>
            <UserLayout>
                <TransactionsPageContent />
            </UserLayout>
        </ProtectedRoute>
    )
}
