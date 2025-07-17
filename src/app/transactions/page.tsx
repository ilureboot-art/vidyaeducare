
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

type Transaction = {
  id: number;
  type: 'deposit' | 'withdrawal';
  description: string;
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Rejected';
  paymentMethod?: string;
  referenceId?: string;
};

// Mock data
const initialTransactions: Transaction[] = [
    { id: 1, type: "deposit" as const, description: "Game Won Reward", amount: 75.00, date: "2024-07-29", status: "Completed" as const },
    { id: 2, type: "withdrawal" as const, description: "Withdrawal Request", amount: -150.00, date: "2024-07-30", status: "Pending" as const, paymentMethod: "user@upi" },
    { id: 3, type: "deposit" as const, description: "Fund Deposit", amount: 100.00, date: "2024-07-29", status: "Completed" as const, referenceId: "UPIREF12345" },
    { id: 4, type: "withdrawal" as const, description: "Ticket Purchase (15)", amount: -25.00, date: "2024-07-27", status: "Completed" as const },
    { id: 5, type: "withdrawal" as const, description: "ReferBolt Subscription", amount: -100.00, date: "2024-07-26", status: "Completed" as const },
    { id: 6, type: "deposit" as const, description: "Fund Deposit", amount: 200.00, date: "2024-07-25", status: "Rejected" as const, referenceId: "UPIREFFAIL" },
    { id: 7, type: "withdrawal" as const, description: "Withdrawal Request", amount: -200.00, date: "2024-07-24", status: "Completed" as const, paymentMethod: "user@upi" },
];

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
    return null; // or a placeholder
  }

  return <>{formattedDate}</>;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

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
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${tx.amount > 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                        {tx.amount > 0 
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
                  <TableCell className={`text-right font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
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
