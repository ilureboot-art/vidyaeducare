
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import type { Transaction } from "@/lib/user-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { useAuth, useFirebase } from "@/context/FirebaseClientProvider";
import { collection, query, where, getDocs, orderBy, onSnapshot, Timestamp, type Firestore } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";

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

function TransactionsPageContent() {
  const { user, loading: authLoading } = useAuth();
  const { db, loading: firebaseLoading } = useFirebase();
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  
  useEffect(() => {
    if (user && !firebaseLoading && db) {
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
  }, [user, db, firebaseLoading]);

  if (authLoading || firebaseLoading || !transactions) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const filteredTransactions = transactions.filter(
    (tx) => {
      const searchTermMatch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) || String(tx.id).toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'all' || tx.status.toLowerCase() === statusFilter;
      const typeMatch = typeFilter === 'all' || (typeFilter === 'deposit' && tx.amount >= 0) || (typeFilter === 'withdrawal' && tx.amount < 0);
      return searchTermMatch && statusMatch && typeMatch;
    }
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            View all financial transactions associated with your account.
          </CardDescription>
          <div className="flex flex-col md:flex-row items-center justify-between pt-4 gap-4">
            <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by description or ID..." 
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
                        <SelectItem value="deposit">Deposits & Credits</SelectItem>
                        <SelectItem value="withdrawal">Withdrawals & Debits</SelectItem>
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
            <TransactionsPageContent />
        </ProtectedRoute>
    )
}
