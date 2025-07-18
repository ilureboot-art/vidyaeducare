
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
    // This effect runs only on the client, ensuring the date format is consistent.
    setFormattedDate(new Date(dateString).toLocaleDateString());
  }, [dateString]);

  if (!formattedDate) {
    return null; // or a placeholder
  }

  return <>{formattedDate}</>;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([...walletData.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

  useEffect(() => {
    // This effect ensures the page re-renders if the shared data changes
    const interval = setInterval(() => {
        if (walletData.transactions.length !== transactions.length) {
            setTransactions([...walletData.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
    }, 500); // Poll for changes
    
    return () => clearInterval(interval);
  }, [transactions]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>A complete record of your financial activity.</CardDescription>
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
              {transactions.length > 0 ? transactions.map((tx) => (
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
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No transactions yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
