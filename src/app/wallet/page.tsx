
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, MinusCircle, Info, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

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
const initialWalletData = {
  balance: 450.50,
  adminPaymentMethods: {
    upiId: "admin-upi@okhdfcbank",
    gpayNumber: "+91 98765 43210",
    phonepeNumber: "+91 98765 43210",
  },
  transactions: [
    { id: 2, type: "withdrawal" as const, description: "Withdrawal Request", amount: -150.00, date: "2024-07-30", status: "Pending" as const, paymentMethod: "user@upi" },
    { id: 3, type: "deposit" as const, description: "Fund Deposit", amount: 100.00, date: "2024-07-29", status: "Completed" as const, referenceId: "UPIREF12345" },
  ],
};


export default function WalletPage() {
  const { toast } = useToast();
  const [balance, setBalance] = useState(initialWalletData.balance);
  const [transactions, setTransactions] = useState<Transaction[]>(initialWalletData.transactions);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const handleAddFunds = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const amount = parseFloat((form.elements.namedItem('amount-add') as HTMLInputElement).value);
    const txnId = (form.elements.namedItem('txnId') as HTMLInputElement).value;

    const newTransaction: Transaction = {
        id: Date.now(),
        type: 'deposit',
        description: 'Fund Deposit Request',
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        referenceId: txnId,
    };
    
    setTransactions([newTransaction, ...transactions]);

    toast({
      title: "Request Submitted",
      description: "Your fund deposit request has been sent for admin approval.",
    });
    setAddFundsOpen(false);
    form.reset();
  }
  
  const handleWithdraw = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const amount = parseFloat((form.elements.namedItem('amount-withdraw') as HTMLInputElement).value);
    const upiId = (form.elements.namedItem('upiId') as HTMLInputElement).value;
    
    if (amount > balance) {
        toast({
            variant: "destructive",
            title: "Insufficient Balance",
            description: "You cannot withdraw more than your available balance.",
        });
        return;
    }

    if (amount < 200) {
        toast({
            variant: "destructive",
            title: "Invalid Amount",
            description: "Minimum withdrawal amount is ₹200.",
        });
        return;
    }
    
    const newTransaction: Transaction = {
        id: Date.now(),
        type: 'withdrawal',
        description: 'Withdrawal Request',
        amount: -amount,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        paymentMethod: upiId,
    };

    setTransactions([newTransaction, ...transactions]);
    setBalance(prev => prev - amount); // Optimistically update balance

    toast({
      title: "Request Submitted",
      description: "Your withdrawal request has been sent for admin approval.",
    });
    setWithdrawOpen(false);
    form.reset();
  }

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
            <p className="text-5xl font-bold text-primary">₹{balance.toFixed(2)}</p>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline"><PlusCircle className="mr-2"/> Add Funds</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Funds</DialogTitle>
                  <DialogDescription>
                    Send payment to the admin details below and enter the transaction reference ID.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="p-3 bg-muted rounded-md text-sm space-y-2">
                        <p className="font-semibold flex items-center gap-2"><Info className="w-4 h-4" />Admin Payment Details</p>
                        <p>UPI ID: <span className="font-mono">{initialWalletData.adminPaymentMethods.upiId}</span></p>
                        <p>GPay: <span className="font-mono">{initialWalletData.adminPaymentMethods.gpayNumber}</span></p>
                        <p>PhonePe: <span className="font-mono">{initialWalletData.adminPaymentMethods.phonepeNumber}</span></p>
                         <p className="text-xs pt-2 text-muted-foreground">You can also scan a QR code if provided by the admin.</p>
                    </div>
                    <form onSubmit={handleAddFunds} className="space-y-4">
                        <div>
                            <Label htmlFor="amount-add">Amount (INR)</Label>
                            <Input id="amount-add" name="amount-add" type="number" placeholder="e.g., 500" required />
                        </div>
                        <div>
                            <Label htmlFor="txnId">Transaction Reference ID</Label>
                            <Input id="txnId" name="txnId" placeholder="Enter the UPI transaction ID" required />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Submit Request</Button>
                        </DialogFooter>
                    </form>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline"><MinusCircle className="mr-2"/> Withdraw</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Withdraw Funds</DialogTitle>
                  <DialogDescription>
                    Request a withdrawal to your payment account. Minimum ₹200.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleWithdraw} className="space-y-4">
                    <div>
                        <Label htmlFor="amount-withdraw">Amount (INR)</Label>
                        <Input id="amount-withdraw" name="amount" type="number" placeholder="e.g., 250" required min="200" />
                    </div>
                    <div>
                        <Label htmlFor="upiId">Your UPI / GPay / PhonePe ID</Label>
                        <Input id="upiId" name="upiId" placeholder="Enter your payment ID" required />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Submit Request</Button>
                    </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
         <CardFooter>
            <Button asChild variant="secondary" className="w-full">
                <Link href="/transactions">
                    <History className="mr-2" />
                    View Full Transaction History
                </Link>
            </Button>
         </CardFooter>
      </Card>
      
    </div>
  );
}
