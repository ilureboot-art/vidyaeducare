
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, MinusCircle, History, ArrowUpRight, ArrowDownLeft, Loader2, AlertCircle, Scan, X, PieChart as PieChartIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { type Transaction, type AdminPaymentMethods } from "@/lib/user-data";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { CopyButton } from "@/components/CopyButton";
import { format } from "date-fns";
import { useAuth, useDb } from "@/firebase";
import { doc, collection, addDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, runTransaction, Timestamp } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserLayout from "@/components/UserLayout";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Html5Qrcode } from "html5-qrcode";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

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

  // Scanner States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "qr-reader";

  useEffect(() => {
    if (user && db) {
        // Fetch Admin Payment Config
        const paymentMethodsRef = doc(db, "configs", "paymentMethods");
        const unsubPaymentMethods = onSnapshot(paymentMethodsRef, (docSnap) => {
            if (docSnap.exists()) {
                setAdminPaymentMethods(docSnap.data() as AdminPaymentMethods);
            } else {
                setAdminPaymentMethods(defaultPaymentMethods);
            }
        }, async (error) => {
            if (error.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: paymentMethodsRef.path,
                    operation: 'get',
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            }
            setAdminPaymentMethods(defaultPaymentMethods);
        });

        // Fetch User Wallet
        const walletRef = doc(db, "wallets", user.uid);
        const unsubWallet = onSnapshot(walletRef, (docSnap) => {
            if (docSnap.exists()) setWalletInfo(docSnap.data() as WalletInfo);
            else setWalletInfo({ balance: 0, coins: 0, referralCode: `REF${user.uid.slice(0,6).toUpperCase()}` });
        }, async (error) => {
             if (error.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: walletRef.path,
                    operation: 'get',
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            }
            setWalletInfo({ balance: 0, coins: 0, referralCode: `REF${user.uid.slice(0,6).toUpperCase()}` });
        });

        // Fetch Recent Transactions
        const txsCol = collection(db, "transactions");
        const q = query(txsCol, where("user", "==", user.uid), orderBy("date", "desc"), limit(50));
        const unsubTransactions = onSnapshot(q, (querySnapshot) => {
            const transactionList: Transaction[] = querySnapshot.docs.map(d => {
                const data = d.data();
                const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
                return { id: d.id, ...data, date } as Transaction;
            });
            setTransactions(transactionList);
        }, async (error) => {
             if (error.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: txsCol.path,
                    operation: 'list',
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            }
            setTransactions([]);
        });

        return () => {
            unsubPaymentMethods();
            unsubWallet();
            unsubTransactions();
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => {});
            }
        };
    }
  }, [user, db]);

  const pieData = useMemo(() => {
    if (!transactions) return [];
    
    const completed = transactions.filter(t => t.status === 'Completed');
    const income = completed.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
    const spending = completed.filter(t => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0);

    if (income === 0 && spending === 0) return [];

    return [
        { name: "Income", value: income, color: "hsl(var(--primary))" },
        { name: "Spending", value: spending, color: "hsl(var(--accent))" }
    ];
  }, [transactions]);

  const handleStartScanner = async () => {
      setIsScannerOpen(true);
      setTimeout(() => {
          const html5QrCode = new Html5Qrcode(scannerId);
          scannerRef.current = html5QrCode;
          const config = { fps: 10, qrbox: { width: 250, height: 250 } };
          
          html5QrCode.start(
              { facingMode: "environment" },
              config,
              (decodedText) => {
                  toast({ title: "QR Scanned!", description: "Verification successful. Please proceed with payment." });
                  handleStopScanner();
              },
              (errorMessage) => {
                  // Scanning...
              }
          ).catch((err) => {
              console.error("Scanner Error:", err);
              toast({ variant: 'destructive', title: "Scanner Error", description: "Could not access camera. Check permissions." });
              setIsScannerOpen(false);
          });
      }, 500);
  };

  const handleStopScanner = () => {
      if (scannerRef.current) {
          scannerRef.current.stop().then(() => {
              setIsScannerOpen(false);
          }).catch((err) => {
              console.error("Error stopping scanner", err);
              setIsScannerOpen(false);
          });
      } else {
          setIsScannerOpen(false);
      }
  };

  const handleAddFunds = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !db) return;
    const form = event.currentTarget;
    const amountInput = form.elements.namedItem('amount-add') as HTMLInputElement;
    const txnIdInput = form.elements.namedItem('txnId') as HTMLInputElement;
    
    const amount = parseFloat(amountInput.value);
    const txnId = txnIdInput.value;
    
    if (!amount || !txnId) return;

    const txData = {
        type: 'deposit',
        description: 'Fund Deposit Request',
        amount: amount,
        date: serverTimestamp(),
        status: 'Pending',
        referenceId: txnId,
        user: user.uid,
    };

    const txsCol = collection(db, "transactions");
    addDoc(txsCol, txData)
        .then(() => {
            toast({ title: "Request Submitted", description: "Your deposit request is pending approval." });
            setAddFundsOpen(false);
            form.reset();
        })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: txsCol.path,
                operation: 'create',
                requestResourceData: txData,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        });
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
        toast({ variant: 'destructive', title: "Invalid Request", description: "Min ₹200 required." });
        return;
    }
    
    runTransaction(db, async (transaction) => {
        const walletRef = doc(db, "wallets", user.uid);
        const walletDoc = await transaction.get(walletRef);
        if (!walletDoc.exists()) throw new Error("Wallet not found.");
        const currentBalance = walletDoc.data().balance;
        transaction.update(walletRef, { balance: currentBalance - amount });
        const newTxRef = doc(collection(db, "transactions"));
        transaction.set(newTxRef, { type: 'withdrawal', description: 'Withdrawal Request', amount: -amount, date: serverTimestamp(), status: 'Pending', paymentMethod: upiId, user: user.uid });
    }).then(() => {
        toast({ title: "Request Submitted", description: `Withdrawal for ₹${amount} sent.` });
        setWithdrawOpen(false);
        form.reset();
    }).catch(async (serverError) => {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: 'multi-path-transaction',
                operation: 'write',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        } else {
             toast({ variant: 'destructive', title: "Error", description: serverError.message });
        }
    });
  }

  if (!walletInfo || !transactions || !adminPaymentMethods) {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-muted-foreground animate-pulse font-medium">Connecting to Wallet...</p>
      </div>
    );
  }

  const pendingCount = transactions.filter(t => t.status === 'Pending').length;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {pendingCount > 0 && (
          <Alert className="bg-primary/5 border-primary/20 mb-6 shadow-sm">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary font-black uppercase tracking-tight text-xs">Transaction Pending</AlertTitle>
              <AlertDescription className="text-xs font-medium">
                  You have {pendingCount} pending {pendingCount === 1 ? 'request' : 'requests'}. Our administrators are processing them for approval.
              </AlertDescription>
          </Alert>
      )}

      <Card className="shadow-lg border-primary/10">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">My Wallet</CardTitle>
          <CardDescription>Manage your funds securely.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card className="text-center p-8 bg-primary/[0.03] border-dashed border-primary/20">
            <p className="text-xs font-bold text-primary tracking-widest uppercase mb-1">AVAILABLE BALANCE</p>
            <p className="text-5xl font-black text-primary">₹{walletInfo.balance.toFixed(2)}</p>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Button size="lg" variant="outline" className="h-16 shadow-sm" onClick={() => setAddFundsOpen(true)}>
                <PlusCircle className="mr-2 h-5 w-5 text-primary"/> Add Funds
            </Button>
            <Button size="lg" variant="outline" className="h-16 shadow-sm" onClick={() => setWithdrawOpen(true)}>
                <MinusCircle className="mr-2 h-5 w-5 text-destructive"/> Withdraw
            </Button>
          </div>

          {pieData.length > 0 && (
            <Card className="border-none bg-muted/20 shadow-inner">
                <CardHeader className="pb-0 text-center">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
                        <PieChartIcon className="w-3 h-3" /> Spending Distribution
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[200px] pt-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={5}
                                dataKey="value"
                                animationBegin={0}
                                animationDuration={1000}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value: number) => [`₹${value.toFixed(2)}`, "Total"]}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                            />
                            <Legend 
                                verticalAlign="bottom" 
                                align="center" 
                                iconType="circle"
                                wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '10px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
          )}
          
          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Recent Activity</h3>
            {transactions.slice(0, 10).map((tx) => (
                 <div key={tx.id} className="flex items-center justify-between p-4 bg-muted/30 border rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-full ${tx.amount >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {tx.amount >= 0 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                            <p className="font-bold text-sm">{tx.description}</p>
                            <p className="text-[10px] text-muted-foreground">{format(new Date(tx.date), 'PP p')}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`font-black text-sm ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.amount >= 0 ? '+' : '-'} ₹{Math.abs(tx.amount).toFixed(2)}
                        </p>
                        <Badge variant={getStatusBadgeVariant(tx.status)} className="text-[9px] h-4">{tx.status}</Badge>
                    </div>
                 </div>
            ))}
            {transactions.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-xl opacity-50">
                    <History className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No transactions yet.</p>
                </div>
            )}
          </div>
        </CardContent>
         <CardFooter>
            <Button asChild variant="ghost" className="w-full text-muted-foreground hover:text-primary">
                <Link href="/transactions"><History className="mr-2 h-4 w-4" /> Full History</Link>
            </Button>
         </CardFooter>
      </Card>

      <Dialog open={addFundsOpen} onOpenChange={(open) => {
          if (!open && isScannerOpen) handleStopScanner();
          setAddFundsOpen(open);
      }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Deposit Funds</DialogTitle>
                <DialogDescription>Scan or use details below to pay, then submit your receipt UTR.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
                <div className="flex flex-col gap-3">
                    <Button 
                        variant="secondary" 
                        className="w-full h-12 font-black gap-2 shadow-sm border-2 border-primary/10"
                        onClick={handleStartScanner}
                        disabled={isScannerOpen}
                    >
                        <Scan className="w-5 h-5" />
                        LAUNCH QR SCANNER
                    </Button>

                    {isScannerOpen && (
                        <div className="relative border-4 border-primary/20 rounded-3xl overflow-hidden bg-black aspect-square">
                            <div id={scannerId} className="w-full h-full" />
                            <div className="absolute inset-0 border-[20px] border-black/40 pointer-events-none">
                                <div className="w-full h-full border-2 border-white/50 rounded-xl" />
                            </div>
                            <Button 
                                variant="destructive" 
                                size="icon" 
                                className="absolute top-4 right-4 rounded-full"
                                onClick={handleStopScanner}
                            >
                                <X size={20} />
                            </Button>
                            <div className="absolute bottom-4 left-0 right-0 text-center">
                                <Badge className="bg-white/20 text-white border-none animate-pulse">Position QR in frame</Badge>
                            </div>
                        </div>
                    )}
                </div>

                <Tabs defaultValue="upi" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upi">UPI / QR</TabsTrigger>
                        <TabsTrigger value="bank">Bank</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upi" className="pt-4 space-y-4">
                        {adminPaymentMethods.qrCodeUrl && (
                            <div className="flex flex-col items-center gap-2">
                                <div className="p-4 bg-muted/30 rounded-lg border">
                                    <Image src={adminPaymentMethods.qrCodeUrl} alt="QR Code" width={200} height={200} className="rounded-md" />
                                </div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground italic">Admin Payment QR</p>
                            </div>
                        )}
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted"><span className="font-semibold">UPI ID:</span><CopyButton valueToCopy={adminPaymentMethods.upiId} /></div>
                        </div>
                    </TabsContent>
                    <TabsContent value="bank" className="pt-4 space-y-2 text-sm">
                         <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted"><span>Account:</span><CopyButton valueToCopy={adminPaymentMethods.accountNumber} /></div>
                         <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted"><span>IFSC:</span><CopyButton valueToCopy={adminPaymentMethods.ifscCode} /></div>
                    </TabsContent>
                </Tabs>

                <form onSubmit={handleAddFunds} className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount-add">Amount Paid (INR)</Label>
                        <Input id="amount-add" name="amount-add" type="number" required placeholder="e.g., 3000" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="txnId">Transaction ID / UTR</Label>
                        <Input id="txnId" name="txnId" required placeholder="Enter 12-digit UTR from receipt" />
                    </div>
                    <DialogFooter><Button type="submit" className="w-full font-black py-6">SUBMIT DEPOSIT REQUEST</Button></DialogFooter>
                </form>
            </div>
          </DialogContent>
      </Dialog>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
          <DialogContent>
            <DialogHeader>
                <DialogTitle>Withdraw Funds</DialogTitle>
                <DialogDescription>Request a payout to your UPI ID. Minimum withdrawal is ₹200.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="amount-withdraw">Amount (INR)</Label>
                    <Input id="amount-withdraw" name="amount-withdraw" type="number" required min="200" placeholder="Min. 200" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="upiId">Receiving UPI ID</Label>
                    <Input id="upiId" name="upiId" required placeholder="name@bank" />
                </div>
                <DialogFooter><Button type="submit" className="w-full font-black py-6">REQUEST PAYOUT</Button></DialogFooter>
            </form>
          </DialogContent>
      </Dialog>
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
