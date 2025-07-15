
"use client";

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
import { Search, Download, ArrowUpRight, ArrowDownLeft } from "lucide-react";

// Mock data for transactions
const transactions = [
  { id: "TXN001", user: "Alice", type: "Withdrawal", amount: 200.00, date: "2024-07-29", status: "Pending" },
  { id: "TXN002", user: "Bob", type: "Deposit", amount: 100.00, date: "2024-07-29", status: "Completed" },
  { id: "TXN003", user: "Charlie", type: "Game Reward", amount: 50.00, date: "2024-07-28", status: "Completed" },
  { id: "TXN004", user: "Alice", type: "Ticket Purchase", amount: -25.00, date: "2024-07-28", status: "Completed" },
  { id: "TXN005", user: "David", type: "Withdrawal", amount: 500.00, date: "2024-07-27", status: "Rejected" },
  { id: "TXN006", user: "Eve", type: "Referral Bonus", amount: 50.00, date: "2024-07-27", status: "Completed" },
];

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

const getTypeIcon = (type: string) => {
    if (type.includes("Withdrawal") || type.includes("Purchase")) {
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
    }
    return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
}

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Transactions</h1>
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            View and manage all financial transactions within the app.
          </CardDescription>
          <div className="flex items-center justify-between pt-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by user or transaction ID..." className="pl-8" />
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
                <TableHead>Transaction ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono">{tx.id}</TableCell>
                  <TableCell className="font-medium">{tx.user}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        {getTypeIcon(tx.type)}
                        <span>{tx.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>{tx.date}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(tx.status)}>
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">₹{tx.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    {tx.status === "Pending" && (
                        <div className="flex gap-2 justify-center">
                            <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">Approve</Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">Reject</Button>
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
