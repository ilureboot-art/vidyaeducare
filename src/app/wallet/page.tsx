
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
        const paymentMethodsRef = doc(db, "configs", "paymentMethods");
        const unsubPaymentMethods = onSnapshot(paymentMethodsRef, (doc) => {
            if (doc.exists()) setAdminPaymentMethods(doc.data() as AdminPaymentMethods);
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
    const amount = parseFloat((form.elements.namedItem('amount-add') as HTMLInputElement).value);
    const txnId = (form.elements.namedItem('txnId') as HTMLInputElement).value;
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
    const amount = parseFloat((form.elements.namedItem('amount-withdraw') as HTMLInputElement).value);
    const upiId = (form.elements.namedItem('upiId') as HTMLInputElement).value;
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
      <div className="w-full max-w-2xl mx-auto flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">My Wallet</CardTitle>
          <CardDescription>Secure balance management.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card className="text-center p-6 bg-primary/10 border-none shadow-inner">
            <p className="text-sm font-medium text-primary">AVAILABLE CASH</p>
            <p className="text-5xl font-bold text-primary">₹{walletInfo.balance.toFixed(2)}</p>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline" className="h-14"><PlusCircle className="mr-2"/> Add Funds</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Add Funds</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-2">
                    <Tabs defaultValue="upi" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="upi">UPI / QR Code</TabsTrigger>
                            <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
                        </TabsList>
                        <TabsContent value="upi" className="pt-4 space-y-4">
                            {adminPaymentMethods.qrCodeUrl && (
                                <div className="flex justify-center p-4 bg-muted rounded-lg">
                                    <Image src={adminPaymentMethods.qrCodeUrl} alt="QR Code" width={200} height={200} />
                                </div>
                            )}
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted"><span className="font-semibold">GPay:</span><CopyButton valueToCopy={adminPaymentMethods.gpayNumber} /></div>
                                <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted"><span className="font-semibold">PhonePe:</span><CopyButton valueToCopy={adminPaymentMethods.phonepeNumber} /></div>
                                <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted"><span className="font-semibold">Main UPI:</span><CopyButton valueToCopy={adminPaymentMethods.upiId} /></div>
                            </div>
                        </TabsContent>
                        <TabsContent value="bank" className="pt-4 space-y-2 text-sm">
                             <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted"><span>Account:</span><CopyButton valueToCopy={adminPaymentMethods.accountNumber} /></div>
                             <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted"><span>IFSC:</span><CopyButton valueToCopy={adminPaymentMethods.ifscCode} /></div>
                             <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted"><span>Bank:</span><span className="font-medium">{adminPaymentMethods.bankName}</span></div>
                        </TabsContent>
                    </Tabs>
                    <form onSubmit={handleAddFunds} className="space-y-4 border-t pt-4">
                        <div><Label htmlFor="amount-add">Amount (INR)</Label><Input id="amount-add" name="amount-add" type="number" required /></div>
                        <div><Label htmlFor="txnId">Reference ID</Label><Input id="txnId" name="txnId" required /></div>
                        <DialogFooter><Button type="submit" className="w-full">Submit Request</Button></DialogFooter>
                    </form>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline" className="h-14"><MinusCircle className="mr-2"/> Withdraw</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Withdraw Funds</DialogTitle></DialogHeader>
                <form onSubmit={handleWithdraw} className="space-y-4">
                    <div><Label htmlFor="amount-withdraw">Amount (INR)</Label><Input id="amount-withdraw" name="amount-withdraw" type="number" required min="200" /></div>
                    <div><Label htmlFor="upiId">Target UPI ID</Label><Input id="upiId" name="upiId" required /></div>
                    <DialogFooter><Button type="submit" className="w-full">Submit Request</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-4 pt-4">
            <h3 className="font-bold text-center">Recent Activity</h3>
            <div className="space-y-2">
                {transactions.length > 0 ? transactions.map((tx) => (
                     <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${tx.amount >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                {tx.amount >= 0 ? <ArrowDownLeft className="w-4 h-4 text-green-600" /> : <ArrowUpRight className="w-4 h-4 text-red-600" />}
                            </div>
                            <div>
                                <p className="font-medium text-sm">{tx.description}</p>
                                <p className="text-[10px] text-muted-foreground">{format(new Date(tx.date), 'PP')}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`font-bold text-sm ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{Math.abs(tx.amount).toFixed(2)}</p>
                            <Badge variant={getStatusBadgeVariant(tx.status)} className="text-[10px] h-5 px-1.5">{tx.status}</Badge>
                        </div>
                     </div>
                )) : <p className="text-sm text-muted-foreground text-center">No transactions found.</p>}
            </div>
          </div>
        </CardContent>
         <CardFooter>
            <Button asChild variant="secondary" className="w-full"><Link href="/transactions"><History className="mr-2" /> Full History</Link></Button>
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
