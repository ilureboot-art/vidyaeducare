
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
import { Search, Download, ArrowUpRight, ArrowDownLeft, Loader2, Calendar as CalendarIcon, FilterX, BarChart3, FileText, CheckCircle2, Clock, XCircle, Copy, Info } from "lucide-react";
import type { Transaction } from "@/lib/user-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format, startOfDay, endOfDay, subDays, eachDayOfInterval } from "date-fns";
import { useAuth, useDb } from "@/firebase";
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserLayout from "@/components/UserLayout";
import Papa from "papaparse";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Dialog, DialogContent } from "@/components/ui/dialog";

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

const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
        case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
        case 'pending': return <Clock className="w-5 h-5 text-amber-500" />;
        case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
        default: return null;
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
  
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  
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

  const chartData = useMemo(() => {
      if (!transactions) return [];
      
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      
      const dates = eachDayOfInterval({
          start: thirtyDaysAgo,
          end: now
      });

      return dates.map(date => {
          const dayTransactions = transactions.filter(tx => {
              const txDate = new Date(tx.date);
              return format(txDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && tx.status === 'Completed';
          });

          const deposits = dayTransactions
              .filter(tx => tx.amount > 0)
              .reduce((sum, tx) => sum + tx.amount, 0);
          
          const withdrawals = dayTransactions
              .filter(tx => tx.amount < 0)
              .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

          return {
              date: format(date, 'MMM dd'),
              deposits,
              withdrawals
          };
      });
  }, [transactions]);

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

  const copyId = (id: string) => {
      navigator.clipboard.writeText(id);
      toast({ title: "Copied!", description: "Transaction ID copied to clipboard." });
  }

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-black tracking-tighter text-primary italic uppercase">TRANSACTION WORKSPACE</h1>
            <p className="text-muted-foreground text-sm font-medium">Analyze your financial activity and spending trends.</p>
        </div>
        <Button variant="outline" className="font-bold gap-2" onClick={handleExportCSV}>
            <Download className="w-4 h-4" /> EXPORT REPORT
        </Button>
      </div>

      {/* Chart Section */}
      <Card className="border-primary/10 shadow-lg overflow-hidden">
          <CardHeader className="bg-primary/5 pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> 30-Day Activity Volume
              </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                      <XAxis 
                        dataKey="date" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        minTickGap={30}
                      />
                      <YAxis 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => `₹${value}`}
                      />
                      <Tooltip 
                        cursor={{fill: 'hsl(var(--muted)/0.2)'}}
                        contentStyle={{ 
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        align="right" 
                        iconType="circle"
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '20px' }}
                      />
                      <Bar 
                        name="Deposits / Inflow"
                        dataKey="deposits" 
                        fill="hsl(var(--primary))" 
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar 
                        name="Withdrawals / Outflow"
                        dataKey="withdrawals" 
                        fill="hsl(var(--accent))" 
                        radius={[2, 2, 0, 0]}
                      />
                  </BarChart>
              </ResponsiveContainer>
          </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
                <CardTitle>History & Filters</CardTitle>
                <CardDescription>Search and filter your detailed transaction records.</CardDescription>
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
                <TableHead className="text-center">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => (
                <TableRow key={tx.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-2">
                        {getTypeIcon(tx.type, tx.amount)}
                        <span className="font-medium">{tx.description}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {typeof tx.id === 'string' && tx.id.length > 12 ? tx.id.substring(0, 12) + '...' : tx.id}
                  </TableCell>
                  <TableCell className="text-xs">{format(new Date(tx.date), 'PP')}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(tx.status)} className="text-[9px] h-5">
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn(
                      "text-right font-bold text-sm",
                      tx.amount >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                      ₹{Math.abs(tx.amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setSelectedTx(tx)}>
                          <Info size={16}/>
                      </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTransactions.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          No transactions found for the selected criteria.
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transaction Detail Receipt Modal */}
      <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
          <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
              {selectedTx && (
                  <div className="bg-background">
                      <div className={cn(
                          "p-8 text-center relative",
                          selectedTx.status === 'Completed' ? "bg-green-500/10" : 
                          selectedTx.status === 'Rejected' ? "bg-red-500/10" : "bg-amber-500/10"
                      )}>
                          <div className="flex justify-center mb-4">
                              <div className={cn(
                                  "w-16 h-16 rounded-full flex items-center justify-center shadow-lg",
                                  selectedTx.status === 'Completed' ? "bg-green-500 text-white" : 
                                  selectedTx.status === 'Rejected' ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                              )}>
                                  {selectedTx.amount >= 0 ? <ArrowDownLeft size(32}/> : <ArrowUpRight size={32}/>}
                              </div>
                          </div>
                          <h2 className="text-3xl font-black tracking-tighter uppercase italic">
                              {selectedTx.amount >= 0 ? "Credit Received" : "Debit Processed"}
                          </h2>
                          <div className="mt-2 flex items-center justify-center gap-2">
                              {getStatusIcon(selectedTx.status)}
                              <Badge variant={getStatusBadgeVariant(selectedTx.status)} className="font-black uppercase tracking-widest text-[10px]">
                                  {selectedTx.status}
                              </Badge>
                          </div>
                      </div>

                      <div className="p-8 space-y-6">
                          <div className="text-center">
                              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">Transaction Amount</p>
                              <p className={cn(
                                  "text-5xl font-black tracking-tighter",
                                  selectedTx.amount >= 0 ? "text-green-600" : "text-red-600"
                              )}>
                                  ₹{Math.abs(selectedTx.amount).toFixed(2)}
                              </p>
                          </div>

                          <div className="space-y-4 pt-4 border-t border-dashed">
                              <div className="flex justify-between items-start">
                                  <p className="text-[10px] font-black uppercase text-muted-foreground">Description</p>
                                  <p className="text-sm font-bold text-right max-w-[200px]">{selectedTx.description}</p>
                              </div>
                              <div className="flex justify-between items-center">
                                  <p className="text-[10px] font-black uppercase text-muted-foreground">Date & Time</p>
                                  <p className="text-sm font-bold">{format(new Date(selectedTx.date), 'PPP p')}</p>
                              </div>
                              <div className="flex justify-between items-center">
                                  <p className="text-[10px] font-black uppercase text-muted-foreground">Type</p>
                                  <Badge variant="outline" className="text-[9px] font-bold uppercase">{selectedTx.type}</Badge>
                              </div>
                              {selectedTx.referenceId && (
                                  <div className="flex justify-between items-center">
                                      <p className="text-[10px] font-black uppercase text-muted-foreground">Ref / UTR</p>
                                      <p className="text-sm font-mono font-bold">{selectedTx.referenceId}</p>
                                  </div>
                              )}
                              {selectedTx.paymentMethod && (
                                  <div className="flex justify-between items-center">
                                      <p className="text-[10px] font-black uppercase text-muted-foreground">Payout To</p>
                                      <p className="text-sm font-bold">{selectedTx.paymentMethod}</p>
                                  </div>
                              )}
                          </div>

                          <div className="pt-6 border-t">
                               <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Transaction ID</p>
                               <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-dashed">
                                   <code className="text-[10px] font-mono break-all pr-4">{selectedTx.id}</code>
                                   <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyId(String(selectedTx.id))}>
                                       <Copy size={14}/>
                                   </Button>
                               </div>
                          </div>
                      </div>

                      <div className="p-6 bg-muted/30 flex justify-center">
                          <Button variant="outline" className="w-full font-black uppercase tracking-tight rounded-xl" onClick={() => setSelectedTx(null)}>
                              Dismiss Receipt
                          </Button>
                      </div>
                  </div>
              )}
          </DialogContent>
      </Dialog>
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
