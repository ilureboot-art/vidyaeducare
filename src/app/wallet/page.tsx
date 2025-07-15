"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight, ArrowDownLeft, Banknote, PlusCircle, MinusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Mock data
const walletData = {
  balance: 450.50,
  transactions: [
    { id: 1, type: "deposit", description: "Referral Commission from user_X", amount: 50.00, date: "2024-07-28" },
    { id: 2, type: "withdrawal", description: "Ticket Package Purchase (15)", amount: -25.00, date: "2024-07-27" },
    { id: 3, type: "deposit", description: "Game Won Reward", amount: 75.00, date: "2024-07-27" },
    { id: 4, type: "withdrawal", description: "ReferBolt Subscription", amount: -100.00, date: "2024-07-26" },
    { id: 5, type: "deposit", description: "Referral Commission from user_Y", amount: 50.00, date: "2024-07-25" },
    { id: 6, type: "deposit", description: "Initial Deposit", amount: 400.50, date: "2024-07-24" },
  ],
};

export default function WalletPage() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">My Wallet</CardTitle>
          <CardDescription>Your balance and transaction history.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card className="text-center p-6 bg-primary/10">
            <p className="text-sm font-medium text-primary">CURRENT BALANCE</p>
            <p className="text-5xl font-bold text-primary">₹{walletData.balance.toFixed(2)}</p>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Button size="lg" variant="outline"><PlusCircle className="mr-2"/> Add Funds</Button>
            <Button size="lg" variant="outline"><MinusCircle className="mr-2"/> Withdraw</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {walletData.transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${tx.type === 'deposit' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                        {tx.type === 'deposit' 
                          ? <ArrowDownLeft className="w-4 h-4 text-green-600 dark:text-green-400" /> 
                          : <ArrowUpRight className="w-4 h-4 text-red-600 dark:text-red-400" />}
                      </div>
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className={`text-right font-bold ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'deposit' ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
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
