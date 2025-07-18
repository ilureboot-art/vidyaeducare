
"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { walletData, type Transaction } from "@/lib/user-data";
import { Button } from "@/components/ui/button";

const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case 'completed':
            return 'default';
        case 'pending':
            return 'secondary';
        case 'rejected':
            return 'destructive';
        default:
            return 'outline';
    }
}

function FormattedDate({ dateString }: { dateString: string }) {
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    setFormattedDate(new Date(dateString).toLocaleDateString());
  }, [dateString]);

  if (!formattedDate) {
    return null; 
  }

  return <>{formattedDate}</>;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([...walletData.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');

  useEffect(() => {
    const interval = setInterval(() => {
        const sortedTransactions = [...walletData.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (JSON.stringify(sortedTransactions) !== JSON.stringify(transactions)) {
            setTransactions(sortedTransactions);
        }
    }, 500); 
    
    return () => clearInterval(interval);
  }, [transactions]);

  const filteredTransactions = transactions.filter(tx => {
    const statusMatch = statusFilter === 'all' || tx.status.toLowerCase() === statusFilter;
    const typeMatch = typeFilter === 'all' || (typeFilter === 'deposit' && tx.amount >= 0) || (typeFilter === 'withdrawal' && tx.amount < 0);
    return statusMatch && typeMatch;
  });

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>A complete record of your financial activity.</CardDescription>
           <div className="flex flex-col gap-2 pt-4">
               <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground min-w-[50px]">Type:</span>
                  <Button variant={typeFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter('all')}>All</Button>
                  <Button variant={typeFilter === 'deposit' ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter('deposit')}>Deposits</Button>
                  <Button variant={typeFilter === 'withdrawal' ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter('withdrawal')}>Withdrawals</Button>
              </div>
              <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground min-w-[50px]">Status:</span>
                  <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('all')}>All</Button>
                  <Button variant={statusFilter === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('pending')}>Pending</Button>
                  <Button variant={statusFilter === 'completed' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('completed')}>Completed</Button>
                  <Button variant={statusFilter === 'rejected' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('rejected')}>Rejected</Button>
              </div>
           </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${tx.amount >= 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                        {tx.amount >= 0 
                          ? <ArrowDownLeft className="w-4 h-4 text-green-600 dark:text-green-400" /> 
                          : <ArrowUpRight className="w-4 h-4 text-red-600 dark:text-red-400" />}
                      </div>
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        <p className="text-xs text-muted-foreground"><FormattedDate dateString={tx.date} /></p>
                        {tx.id && <p className="text-xs text-muted-foreground font-mono">ID: {tx.id}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(tx.status)}>{tx.status}</Badge>
                  </TableCell>
                  <TableCell className={`text-right font-bold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount >= 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No transactions found for this filter.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
