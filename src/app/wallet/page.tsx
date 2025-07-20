
"use client";

import { useState, useEffect } from "react";
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
import { PlusCircle, MinusCircle, Info, History, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { walletData, addTransaction, type Transaction } from "@/lib/user-data";
import { Badge } from "@/components/ui/badge";
import { addNotification } from "@/lib/notifications";
import { Separator } from "@/components/ui/separator";

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
    return null; // Or a loading skeleton
  }

  return <>{formattedDate}</>;
}

export default function WalletPage() {
  const { toast } = useToast();
  const [balance, setBalance] = useState(walletData.balance);
  const [transactions, setTransactions] = useState<Transaction[]>([...walletData.transactions]);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (walletData.balance !== balance) {
        setBalance(walletData.balance);
      }
      if (walletData.transactions.length !== transactions.length) {
        setTransactions([...walletData.transactions]);
      }
    }, 500); 

    return () => clearInterval(interval);
  }, [balance, transactions.length]);

  const handleAddFunds = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const amount = parseFloat((form.elements.namedItem('amount-add') as HTMLInputElement).value);
    const txnId = (form.elements.namedItem('txnId') as HTMLInputElement).value;

    if (!amount || !txnId) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields.'});
        return;
    }

    const newTransaction: Transaction = {
        id: Date.now(),
        type: 'deposit',
        description: 'Fund Deposit Request',
        amount: amount,
        date: new Date().toISOString(),
        status: 'Pending',
        referenceId: txnId,
        user: "Alex Doe",
    };
    
    addTransaction(newTransaction);
    addNotification({
        type: "deposit_request",
        message: `Alex Doe requested to deposit ₹${amount} (Ref: ${txnId}).`,
        userId: 'admin',
    });
    setTransactions([...walletData.transactions]);

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
    
    if (!amount || !upiId) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields.'});
        return;
    }

    if (amount > walletData.balance) {
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
    
    walletData.balance -= amount; 
    
    const newTransaction: Transaction = {
        id: Date.now(),
        type: 'withdrawal',
        description: 'Withdrawal Request',
        amount: -amount,
        date: new Date().toISOString(),
        status: 'Pending',
        paymentMethod: upiId,
        user: "Alex Doe",
    };

    addTransaction(newTransaction);
    addNotification({
        type: "withdrawal_request",
        message: `Alex Doe requested to withdraw ₹${amount}.`,
        userId: 'admin'
    });
    setBalance(walletData.balance); 
    setTransactions([...walletData.transactions]);

    toast({
      title: "Request Submitted",
      description: `Your withdrawal request for ₹${amount} has been sent for admin approval.`,
    });
    setWithdrawOpen(false);
    form.reset();
  }

  const { adminPaymentMethods } = walletData;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">My Wallet</CardTitle>
          <CardDescription>Your balance and recent activity.</CardDescription>
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
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Funds</DialogTitle>
                  <DialogDescription>
                    Send payment to the admin details below and enter the transaction reference ID.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-md text-sm space-y-3">
                        <p className="font-semibold flex items-center gap-2"><Info className="w-4 h-4" />Admin Payment Details</p>
                        
                        <div>
                            <p className="font-bold">Bank Transfer</p>
                            <p>Name: <span className="font-mono">{adminPaymentMethods.accountHolderName}</span></p>
                            <p>Account: <span className="font-mono">{adminPaymentMethods.accountNumber}</span></p>
                            <p>IFSC: <span className="font-mono">{adminPaymentMethods.ifscCode}</span></p>
                            <p>Bank: <span className="font-mono">{adminPaymentMethods.bankName}</span></p>
                        </div>
                        <Separator />
                        <div>
                            <p className="font-bold">UPI</p>
                            <p>GPay: <span className="font-mono">{adminPaymentMethods.gpayNumber}</span> / <span className="font-mono">{adminPaymentMethods.gpayUpiId}</span></p>
                            <p>PhonePe: <span className="font-mono">{adminPaymentMethods.phonepeNumber}</span> / <span className="font-mono">{adminPaymentMethods.phonepeUpiId}</span></p>
                            <p>Main UPI: <span className="font-mono">{adminPaymentMethods.upiId}</span></p>
                        </div>
                        
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
                        <Input id="amount-withdraw" name="amount-withdraw" type="number" placeholder="e.g., 250" required min="200" />
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

          <div className="space-y-4 pt-4">
            <h3 className="font-semibold text-lg text-center">Recent Activity</h3>
            {transactions.length > 0 ? (
                <div className="space-y-2">
                    {transactions.slice(0, 3).map((tx) => (
                         <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
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
                            <div className="text-right">
                                <p className={`font-bold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                     {tx.amount >= 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
                                </p>
                                <Badge variant={getStatusBadgeVariant(tx.status)} className="mt-1">{tx.status}</Badge>
                            </div>
                         </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center">No recent transactions.</p>
            )}
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
