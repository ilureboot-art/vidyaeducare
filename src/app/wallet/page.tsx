
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
import { PlusCircle, MinusCircle, History, ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { type Transaction, type AdminPaymentMethods } from "@/lib/user-data";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { CopyButton } from "@/components/CopyButton";
import { format } from "date-fns";
import { useAuth, useDb } from "@/firebase";
import { doc, getDoc, collection, addDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, runTransaction, Timestamp } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserLayout from "@/components/UserLayout";

const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case 'completed': return 'default';
        case 'pending': return 'secondary';
        case 'rejected': return 'destructive';
        default: return 'outline';
    }
}

type WalletInfo = {
  balance: number;
  coins: number;
  referralCode: string;
}

const defaultPaymentMethods: AdminPaymentMethods = {
    accountHolderName: "Not Configured",
    accountNumber: "N/A",
    ifscCode: "N/A",
    bankName: "N/A",
    upiId: "N/A",
    gpayNumber: "N/A",
    gpayUpiId: "N/A",
    phonepeNumber: "N/A",
    phonepeUpiId: "N/A",
    qrCodeUrl: ""
};

function WalletPageContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const db = useDb();
  
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [adminPaymentMethods, setAdminPaymentMethods] = useState<AdminPaymentMethods | null>(null);

  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  useEffect(() => {
    if (user && db) {
        // PERFORMANCE OPTIMIZATION: Immediate fallback if config doesn't exist
        const paymentMethodsRef = doc(db, "configs", "paymentMethods");
        const unsubPaymentMethods = onSnapshot(paymentMethodsRef, (doc) => {
            if (doc.exists()) {
                setAdminPaymentMethods(doc.data() as AdminPaymentMethods);
            } else {
                setAdminPaymentMethods(defaultPaymentMethods);
            }
        });

        const walletRef = doc(db, "wallets", user.uid);
        const unsubWallet = onSnapshot(walletRef, (doc) => {
            if (doc.exists()) setWalletInfo(doc.data() as WalletInfo);
            else setWalletInfo({ balance: 0, coins: 0, referralCode: `REF${user.uid.slice(0,6).toUpperCase()}` });
        });

        const txsRef = collection(db, "transactions");
        const q = query(txsRef, where("user", "==", user.uid), orderBy("date", "desc"), limit(10));
        const unsubTransactions = onSnapshot(q, (querySnapshot) => {
            const transactionList: Transaction[] = querySnapshot.docs.map(d => {
                const data = d.data();
                const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
                return { id: d.id, ...data, date } as Transaction;
            });
            setTransactions(transactionList);
        }, (err) => {
            console.error("Transactions sync error:", err);
            setTransactions([]);
        });

        return () => {
            unsubPaymentMethods();
            unsubWallet();
            unsubTransactions();
        };
    }
  }, [user, db]);

  const handleAddFunds = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !db) return;
    const form = event.currentTarget;
    const amountInput = form.elements.namedItem('amount-add') as HTMLInputElement;
    const txnIdInput = form.elements.namedItem('txnId') as HTMLInputElement;
    const amount = parseFloat(amountInput.value);
    const txnId = txnIdInput.value;
    
    if (!amount || !txnId) return;

    try {
        await addDoc(collection(db, "transactions"), {
            type: 'deposit',
            description: 'Fund Deposit Request',
            amount: amount,
            date: serverTimestamp(),
            status: 'Pending',
            referenceId: txnId,
            user: user.uid,
        });
        toast({ title: "Request Submitted", description: "Your fund deposit request has been sent for approval." });
        setAddFundsOpen(false);
        form.reset();
    } catch(error) {
        toast({ variant: 'destructive', title: "Error", description: "Could not submit request."});
    }
  }
  
  const handleWithdraw = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!walletInfo || !user || !db) return;
    const form = event.currentTarget;
    const amountInput = form.elements.namedItem('amount-withdraw') as HTMLInputElement;
    const upiIdInput = form.elements.namedItem('upiId') as HTMLInputElement;
    const amount = parseFloat(amountInput.value);
    const upiId = upiIdInput.value;

    if (!amount || !upiId || amount > walletInfo.balance || amount < 200) {
        toast({ variant: 'destructive', title: "Invalid Request", description: "Check balance and minimum amount (₹200)." });
        return;
    }
    
    try {
        await runTransaction(db, async (transaction) => {
            const walletRef = doc(db, "wallets", user.uid);
            const walletDoc = await transaction.get(walletRef);
            if (!walletDoc.exists()) throw new Error("Wallet not found.");
            const currentBalance = walletDoc.data().balance;
            transaction.update(walletRef, { balance: currentBalance - amount });
            const newTxRef = doc(collection(db, "transactions"));
            transaction.set(newTxRef, { type: 'withdrawal', description: 'Withdrawal Request', amount: -amount, date: serverTimestamp(), status: 'Pending', paymentMethod: upiId, user: user.uid });
        });
        toast({ title: "Request Submitted", description: `Withdrawal request for ₹${amount} sent.` });
        setWithdrawOpen(false);
        form.reset();
    } catch(error: any) {
        toast({ variant: 'destructive', title: "Error", description: error.message });
    }
  }

  if (!walletInfo || !transactions || !adminPaymentMethods) {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-muted-foreground animate-pulse font-medium">Connecting to Wallet Service...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="shadow-lg border-primary/10">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">My Wallet</CardTitle>
          <CardDescription>Secure balance management and financial history.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card className="text-center p-8 bg-primary/[0.03] border-dashed border-primary/20 shadow-inner">
            <p className="text-xs font-bold text-primary tracking-widest uppercase mb-1">AVAILABLE CASH</p>
            <p className="text-5xl font-black text-primary tracking-tighter">₹{walletInfo.balance.toFixed(2)}</p>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline" className="h-16 shadow-sm border-primary/20 hover:bg-primary/5"><PlusCircle className="mr-2 h-5 w-5 text-primary"/> Add Funds</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Deposit Funds</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-2">
                    <Tabs defaultValue="upi" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="upi">UPI / QR Code</TabsTrigger>
                            <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
                        </TabsList>
                        <TabsContent value="upi" className="pt-4 space-y-4">
                            {adminPaymentMethods.qrCodeUrl && (
                                <div className="flex justify-center p-4 bg-muted/30 rounded-lg border">
                                    <Image src={adminPaymentMethods.qrCodeUrl} alt="QR Code" width={200} height={200} className="rounded-md" />
                                </div>
                            )}
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center p-2.5 rounded-md hover:bg-muted border border-transparent hover:border-border transition-colors"><span className="font-semibold">GPay:</span><CopyButton valueToCopy={adminPaymentMethods.gpayNumber} /></div>
                                <div className="flex justify-between items-center p-2.5 rounded-md hover:bg-muted border border-transparent hover:border-border transition-colors"><span className="font-semibold">PhonePe:</span><CopyButton valueToCopy={adminPaymentMethods.phonepeNumber} /></div>
                                <div className="flex justify-between items-center p-2.5 rounded-md hover:bg-muted border border-transparent hover:border-border transition-colors"><span className="font-semibold">Main UPI:</span><CopyButton valueToCopy={adminPaymentMethods.upiId} /></div>
                            </div>
                        </TabsContent>
                        <TabsContent value="bank" className="pt-4 space-y-2 text-sm">
                             <div className="flex justify-between items-center p-2.5 rounded-md hover:bg-muted border border-transparent hover:border-border transition-colors"><span>Account:</span><CopyButton valueToCopy={adminPaymentMethods.accountNumber} /></div>
                             <div className="flex justify-between items-center p-2.5 rounded-md hover:bg-muted border border-transparent hover:border-border transition-colors"><span>IFSC:</span><CopyButton valueToCopy={adminPaymentMethods.ifscCode} /></div>
                             <div className="flex justify-between items-center p-2.5 rounded-md hover:bg-muted border border-transparent hover:border-border transition-colors"><span>Bank:</span><span className="font-bold">{adminPaymentMethods.bankName}</span></div>
                        </TabsContent>
                    </Tabs>
                    <form onSubmit={handleAddFunds} className="space-y-4 border-t pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount-add">Amount to Deposit (INR)</Label>
                            <Input id="amount-add" name="amount-add" type="number" required placeholder="Enter amount paid" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="txnId">Reference ID / UTR</Label>
                            <Input id="txnId" name="txnId" required placeholder="Copy from payment app" />
                        </div>
                        <DialogFooter><Button type="submit" className="w-full py-6 font-bold shadow-lg">Submit Request</Button></DialogFooter>
                    </form>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline" className="h-16 shadow-sm border-destructive/20 hover:bg-destructive/5"><MinusCircle className="mr-2 h-5 w-5 text-destructive"/> Withdraw</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Withdraw Funds</DialogTitle></DialogHeader>
                <form onSubmit={handleWithdraw} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount-withdraw">Amount (INR)</Label>
                        <Input id="amount-withdraw" name="amount-withdraw" type="number" required min="200" placeholder="Minimum ₹200" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="upiId">Your Receiving UPI ID</Label>
                        <Input id="upiId" name="upiId" required placeholder="e.g. mobile@upi" />
                    </div>
                    <DialogFooter><Button type="submit" className="w-full py-6 font-bold shadow-lg">Submit Request</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Recent Activity</h3>
            <div className="space-y-2">
                {transactions.length > 0 ? transactions.map((tx) => (
                     <div key={tx.id} className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors border rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-full ${tx.amount >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {tx.amount >= 0 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="font-bold text-sm leading-tight">{tx.description}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(tx.date), 'PP p')}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`font-black text-sm ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.amount >= 0 ? '+' : '-'} ₹{Math.abs(tx.amount).toFixed(2)}
                            </p>
                            <Badge variant={getStatusBadgeVariant(tx.status)} className="text-[9px] h-4 px-1.5 font-bold">{tx.status}</Badge>
                        </div>
                     </div>
                )) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
                        <History className="w-10 h-10 text-muted-foreground mx-auto opacity-20 mb-2" />
                        <p className="text-sm text-muted-foreground font-medium">No transactions recorded yet.</p>
                    </div>
                )}
            </div>
          </div>
        </CardContent>
         <CardFooter>
            <Button asChild variant="ghost" className="w-full h-12 text-muted-foreground hover:text-primary"><Link href="/transactions"><History className="mr-2 h-4 w-4" /> View Full History</Link></Button>
         </CardFooter>
      </Card>
    </div>
  );
}

export default function WalletPage() {
    return (
        <ProtectedRoute>
            <UserLayout>
                <WalletPageContent />
            </UserLayout>
        </ProtectedRoute>
    );
}
