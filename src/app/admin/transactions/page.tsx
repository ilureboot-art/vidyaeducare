
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
import { Search, Download, ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type Transaction } from "@/lib/user-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { useAppData, useDataUpdaters } from "@/hooks/use-hydrate-data";

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
    if (type.includes("withdrawal") || type.includes("Purchase") || amount < 0) {
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
    }
    return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
}

export default function TransactionsPage() {
  const appData = useAppData();
  const { setWalletData } = useDataUpdaters();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  
  useEffect(() => {
    if (appData && appData.walletData) {
        const sortedTransactions = [...appData.walletData.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(sortedTransactions);
    }
  }, [appData]);


  const handleTransactionStatus = (id: number, newStatus: "Completed" | "Rejected") => {
    if (!appData || !appData.walletData) return;

    const txToUpdate = appData.walletData.transactions.find(tx => tx.id === id);
    if (!txToUpdate || txToUpdate.status !== "Pending") {
        toast({ title: "Action not allowed", description: "This transaction has already been processed."});
        return;
    }

    const updatedTransactions = appData.walletData.transactions.map(tx => 
        tx.id === id ? { ...tx, status: newStatus } : tx
    );
    
    let newBalance = appData.walletData.balance;
    if (newStatus === 'Completed' && txToUpdate.type === 'deposit') {
        newBalance += txToUpdate.amount;
    }

    setWalletData({ ...appData.walletData, transactions: updatedTransactions, balance: newBalance });

    toast({
      title: "Transaction Updated",
      description: `Transaction ${id} has been marked as ${newStatus}.`,
    });
  };

  if (!appData || !transactions) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const filteredTransactions = transactions.filter(
    (tx) => {
      const searchTermMatch = tx.user?.toLowerCase().includes(searchTerm.toLowerCase()) || String(tx.id).toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'all' || tx.status.toLowerCase() === statusFilter;
      const typeMatch = typeFilter === 'all' || (typeFilter === 'deposit' && tx.amount >= 0) || (typeFilter === 'withdrawal' && tx.amount < 0);
      return searchTermMatch && statusMatch && typeMatch;
    }
  );

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
            <Button variant="outline">
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
                  <TableCell className="font-medium">{tx.user || 'System'}</TableCell>
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
                  <TableCell className="text-center">
                    {tx.status === "Pending" && (
                        <div className="flex gap-2 justify-center">
                            <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" onClick={() => handleTransactionStatus(tx.id, "Completed")}>Approve</Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleTransactionStatus(tx.id, "Rejected")}>Reject</Button>
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

    