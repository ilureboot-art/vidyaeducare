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
import { Search, Download, ArrowUpRight, ArrowDownLeft, Loader2, Calendar as CalendarIcon, FilterX, BarChart3, FileText, CheckCircle2, Clock, XCircle, Copy, Info, IndianRupee, Printer } from "lucide-react";
import type { Transaction } from "@/lib/user-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format, startOfDay, endOfDay, subDays, eachDayOfInterval } from "date-fns";
import { useAuth, useDb } from "@/firebase";
import { collection, query, where, orderBy, getDocs, limit, startAfter, Timestamp } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserLayout from "@/components/UserLayout";
import Papa from "papaparse";
import { downloadInvoicePDF } from "@/lib/pdf-export";
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

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

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
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const fetchTransactions = async (isFirstPage: boolean = false) => {
    if (!user || !db) return;
    if (!isFirstPage && (isLoadingMore || !hasMore)) return;
    
    if (!isFirstPage) {
      setIsLoadingMore(true);
    }

    try {
      const txsRef = collection(db, "transactions");
      const PAGE_SIZE = 15;
      let q;
      if (isFirstPage) {
        q = query(txsRef, where("user", "==", user.uid), orderBy("date", "desc"), limit(PAGE_SIZE));
      } else {
        q = query(txsRef, where("user", "==", user.uid), orderBy("date", "desc"), startAfter(lastVisible), limit(PAGE_SIZE));
      }

      const querySnapshot = await getDocs(q);
      const newTxs = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
        return { id: doc.id, ...data, date } as Transaction;
      });

      if (isFirstPage) {
        setTransactions(newTxs);
      } else {
        setTransactions(prev => [...(prev || []), ...newTxs]);
      }

      if (querySnapshot.docs.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
    } catch (e) {
      console.error("Failed to fetch transactions:", e);
    } finally {
      setIsLoadingMore(false);
    }
  };
  
  const getInvoiceDetails = (tx: Transaction) => {
    if (tx.invoiceNumber) {
        return {
            invoiceNumber: tx.invoiceNumber,
            packageName: tx.packageName || tx.description || 'Mock Test Package',
            basePrice: tx.basePrice || Math.abs(tx.amount) / 1.18,
            discountDetails: tx.discountDetails || { base: 0, referral: 0, recommendation: 0, special: 0, totalAmount: 0 },
            taxableAmount: tx.taxableAmount || Math.abs(tx.amount) / 1.18,
            gstRate: tx.gstRate || 18,
            gstAmount: tx.gstAmount || Math.abs(tx.amount) - (Math.abs(tx.amount) / 1.18),
            finalPrice: tx.finalPrice || Math.abs(tx.amount),
            hsnSacCode: tx.hsnSacCode || '999294',
            date: tx.date,
            billingDetails: tx.billingDetails || {
                name: user?.displayName || 'Vidya EduCare Student',
                email: user?.email || 'student@vidyaeducare.com'
            }
        };
    }
    
    const isPurchase = tx.type === 'Purchase' || tx.description?.toLowerCase().includes('purchase:');
    if (isPurchase) {
        const amount = Math.abs(tx.amount);
        const basePrice = amount / 1.18;
        const gstAmount = amount - basePrice;
        return {
            invoiceNumber: `INV-${new Date(tx.date).getTime().toString().slice(-6)}-${user?.uid?.slice(0, 4).toUpperCase() || 'STU'}`,
            packageName: tx.description?.replace('Purchase: ', '') || 'Mock Test Package',
            basePrice: basePrice,
            discountDetails: { base: 0, referral: 0, recommendation: 0, special: 0, totalAmount: 0 },
            taxableAmount: basePrice,
            gstRate: 18,
            gstAmount: gstAmount,
            finalPrice: amount,
            hsnSacCode: '999294',
            date: tx.date,
            billingDetails: {
                name: user?.displayName || 'Vidya EduCare Student',
                email: user?.email || 'student@vidyaeducare.com'
            }
        };
    }
    return null;
  };
  
  useEffect(() => {
    fetchTransactions(true);
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

  const filteredTotals = useMemo(() => {
      return filteredTransactions.reduce((acc, tx) => {
          if (tx.amount >= 0) acc.deposits += tx.amount;
          else acc.withdrawals += Math.abs(tx.amount);
          return acc;
      }, { deposits: 0, withdrawals: 0 });
  }, [filteredTransactions]);

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-green-500/[0.03] border-green-500/20 shadow-sm overflow-hidden group hover:border-green-500/40 transition-all">
              <CardHeader className="py-4 px-6 flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest text-green-600/70">Total Inflow (Filtered)</CardTitle>
                      <p className="text-2xl font-black text-green-600">₹{formatCurrency(filteredTotals.deposits)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                      <ArrowDownLeft size={24}/>
                  </div>
              </CardHeader>
              <div className="h-1 bg-green-500/10 w-full" />
          </Card>
          <Card className="bg-red-500/[0.03] border-red-500/20 shadow-sm overflow-hidden group hover:border-red-500/40 transition-all">
              <CardHeader className="py-4 px-6 flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest text-red-600/70">Total Outflow (Filtered)</CardTitle>
                      <p className="text-2xl font-black text-red-600">₹{formatCurrency(filteredTotals.withdrawals)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                      <ArrowUpRight size={24}/>
                  </div>
              </CardHeader>
              <div className="h-1 bg-red-500/10 w-full" />
          </Card>
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
                      ₹{formatCurrency(Math.abs(tx.amount))}
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
        {hasMore && transactions && transactions.length > 0 && (
            <div className="flex justify-center pb-6">
                <Button 
                    variant="outline" 
                    onClick={() => fetchTransactions(false)} 
                    disabled={isLoadingMore}
                    className="font-bold border-primary/20 text-primary hover:bg-primary/5 px-8 rounded-xl h-10 shadow-sm"
                >
                    {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    LOAD MORE TRANSACTIONS
                </Button>
            </div>
        )}
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
                                  {selectedTx.amount >= 0 ? <ArrowDownLeft size={32}/> : <ArrowUpRight size={32}/>}
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
                                  ₹{formatCurrency(Math.abs(selectedTx.amount))}
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
                              {(selectedTx.type === 'Purchase' || selectedTx.description?.toLowerCase().includes('purchase:') || selectedTx.invoiceNumber) && (
                                  <div className="flex justify-between items-center pt-4 border-t border-dashed">
                                      <p className="text-[10px] font-black uppercase text-muted-foreground">Tax Invoice</p>
                                      <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="font-bold gap-2 text-xs text-primary border-primary/20 hover:bg-primary/5"
                                          onClick={() => {
                                              const details = getInvoiceDetails(selectedTx);
                                              if (details) {
                                                  setViewingInvoice(details);
                                                  setSelectedTx(null);
                                              }
                                          }}
                                      >
                                          <FileText size={14} /> View Invoice
                                      </Button>
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

      {viewingInvoice && (
        <Dialog open={!!viewingInvoice} onOpenChange={(open) => !open && setViewingInvoice(null)}>
            <DialogContent className="max-w-2xl p-8 rounded-[2rem] border-none shadow-2xl overflow-y-auto max-h-[90vh]">
                <div id="invoice-print-area" className="bg-background text-foreground space-y-6">
                    <style>{`
                      @media print {
                        body * {
                          visibility: hidden;
                        }
                        #invoice-print-area, #invoice-print-area * {
                          visibility: visible;
                        }
                        #invoice-print-area {
                          position: absolute;
                          left: 0;
                          top: 0;
                          width: 100%;
                        }
                      }
                    `}</style>
                    <div className="flex justify-between items-start border-b pb-6">
                        <div>
                            <h1 className="text-3xl font-black text-primary italic uppercase tracking-tighter">VIDYA <span className="text-accent">EDUCARE</span></h1>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Academic Excellence Platform</p>
                        </div>
                        <div className="text-right">
                            <Badge className="bg-primary/10 text-primary border-none font-black text-xs uppercase tracking-widest px-4 py-1.5">TAX INVOICE</Badge>
                            <p className="text-xs font-mono font-bold mt-2">{viewingInvoice.invoiceNumber}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(viewingInvoice.date).toLocaleString('en-IN')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 text-sm">
                        <div>
                            <h3 className="font-black uppercase text-[10px] text-muted-foreground tracking-wider mb-2">Billed To</h3>
                            <p className="font-black text-foreground">{viewingInvoice.billingDetails.name}</p>
                            <p className="text-muted-foreground text-xs">{viewingInvoice.billingDetails.email}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="font-black uppercase text-[10px] text-muted-foreground tracking-wider mb-2">Service Provider</h3>
                            <p className="font-black text-foreground">Vidya EduCare Private Ltd.</p>
                            <p className="text-muted-foreground text-xs">GSTIN: 27AACCV1234F1Z5</p>
                        </div>
                    </div>

                    <div className="border rounded-2xl overflow-hidden mt-6">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/50 border-b text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                    <th className="p-4">Description</th>
                                    <th className="p-4 text-center">HSN/SAC</th>
                                    <th className="p-4 text-right">Base Price</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-bold">
                                <tr className="border-b">
                                    <td className="p-4">
                                        <p className="text-foreground font-black">{viewingInvoice.packageName}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Bilingual Mock Test Portal</p>
                                    </td>
                                    <td className="p-4 text-center font-mono text-xs">{viewingInvoice.hsnSacCode}</td>
                                    <td className="p-4 text-right">₹{viewingInvoice.basePrice.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end pt-4">
                        <div className="w-80 space-y-3 text-sm font-bold">
                            <div className="flex justify-between text-muted-foreground text-xs">
                                <span>Base Product Price:</span>
                                <span>₹{viewingInvoice.basePrice.toFixed(2)}</span>
                            </div>
                            {viewingInvoice.discountDetails && viewingInvoice.discountDetails.totalAmount > 0 && (
                                <div className="space-y-1 bg-accent/5 p-3 rounded-xl border border-accent/10 animate-in fade-in">
                                    <div className="text-[10px] font-black text-accent uppercase tracking-wider mb-1">Applied Discounts:</div>
                                    {viewingInvoice.discountDetails.base > 0 && (
                                        <div className="flex justify-between text-xs text-accent">
                                            <span>• Base Discount ({viewingInvoice.discountDetails.base}%):</span>
                                            <span>-₹{(viewingInvoice.basePrice * viewingInvoice.discountDetails.base / 100).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {viewingInvoice.discountDetails.referral > 0 && (
                                        <div className="flex justify-between text-xs text-accent">
                                            <span>• Referral Discount ({viewingInvoice.discountDetails.referral}%):</span>
                                            <span>-₹{(viewingInvoice.basePrice * viewingInvoice.discountDetails.referral / 100).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {viewingInvoice.discountDetails.recommendation > 0 && (
                                        <div className="flex justify-between text-xs text-accent">
                                            <span>• Fast-Mover Bonus ({viewingInvoice.discountDetails.recommendation}%):</span>
                                            <span>-₹{(viewingInvoice.basePrice * viewingInvoice.discountDetails.recommendation / 100).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {viewingInvoice.discountDetails.special > 0 && (
                                        <div className="flex justify-between text-xs text-accent">
                                            <span>• Special Promotion ({viewingInvoice.discountDetails.special}%):</span>
                                            <span>-₹{(viewingInvoice.basePrice * viewingInvoice.discountDetails.special / 100).toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-xs font-black border-t border-dashed border-accent/20 pt-1.5 mt-1.5 text-accent">
                                        <span>Total Discount:</span>
                                        <span>-₹{viewingInvoice.discountDetails.totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between border-t pt-2 mt-2">
                                <span>Taxable Value (Total):</span>
                                <span>₹{viewingInvoice.taxableAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground text-xs">
                                <span>GST ({viewingInvoice.gstRate}%):</span>
                                <span>₹{viewingInvoice.gstAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t border-dashed pt-3 text-lg font-black text-primary">
                                <span>Final Total (Paid):</span>
                                <span>₹{viewingInvoice.finalPrice.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-6 text-center text-muted-foreground text-[9px] font-black uppercase tracking-[0.2em]">
                        Thank you for choosing Vidya EduCare!
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t print:hidden">
                    <Button variant="ghost" onClick={() => setViewingInvoice(null)} className="font-bold">Close</Button>
                    <Button onClick={() => downloadInvoicePDF(viewingInvoice)} className="font-black gap-2 bg-primary text-white shadow-lg"><Printer size={16} /> Download PDF</Button>
                </div>
            </DialogContent>
        </Dialog>
      )}
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
