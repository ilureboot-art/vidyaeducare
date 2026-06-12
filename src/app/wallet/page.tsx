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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, MinusCircle, History, ArrowUpRight, ArrowDownLeft, Loader2, AlertCircle, Scan, X, PieChart as PieChartIcon, AlertTriangle, FileText, CheckCircle2, Clock, XCircle, Copy, ArrowLeft, ShieldCheck, Zap, CheckCircle, TrendingUp, Users, Store, LineChart as LineChartIcon, Camera, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { type Transaction, type AdminPaymentMethods } from "@/lib/user-data";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { CopyButton } from "@/components/CopyButton";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { useAuth, useDb } from "@/firebase";
import { doc, collection, addDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, runTransaction, Timestamp } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserLayout from "@/components/UserLayout";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Html5Qrcode } from "html5-qrcode";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area } from "recharts";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case 'completed': return 'default';
        case 'pending': return 'secondary';
        case 'rejected': return 'destructive';
        default: return 'outline';
    }
}

const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
        case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
        case 'pending': return <Clock className="w-5 h-5 text-amber-500" />;
        case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
        default: return null;
    }
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

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

const LOW_BALANCE_THRESHOLD = 200;

type WalletView = 'main' | 'add' | 'withdraw' | 'success';

function WalletPageContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const db = useDb();
  
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [adminPaymentMethods, setAdminPaymentMethods] = useState<AdminPaymentMethods | null>(null);
  const [activeView, setActiveView] = useState<WalletView>('main');
  const [successAmount, setSuccessAmount] = useState<number>(0);

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  
  // Add Funds Form State
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
                return { id: doc.id, ...data, date } as Transaction;
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

  const trendData = useMemo(() => {
    if (!transactions || !walletInfo) return [];
    
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    
    const dates = eachDayOfInterval({
        start: thirtyDaysAgo,
        end: now
    });

    // Calculate balance at the start of the window
    const completedAfterWindowStart = transactions.filter(t => 
        t.status === 'Completed' && new Date(t.date) >= thirtyDaysAgo
    );
    const totalChangeInWindow = completedAfterWindowStart.reduce((acc, t) => acc + t.amount, 0);
    let runningBalance = walletInfo.balance - totalChangeInWindow;

    return dates.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayTransactions = transactions.filter(tx => {
            const txDate = new Date(tx.date);
            return format(txDate, 'yyyy-MM-dd') === dateStr && tx.status === 'Completed';
        });

        const income = dayTransactions
            .filter(t => t.amount > 0)
            .reduce((acc, t) => acc + t.amount, 0);
        
        const spending = dayTransactions
            .filter(t => t.amount < 0)
            .reduce((acc, t) => acc + Math.abs(t.amount), 0);

        runningBalance += (income - spending);

        return {
            date: format(date, 'MMM dd'),
            income,
            spending,
            balance: runningBalance
        };
    });
  }, [transactions, walletInfo]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'Invalid File', description: 'Please upload an image of your payment receipt.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
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
        receiptUrl: receiptImage || null,
    };

    const txsCol = collection(db, "transactions");
    addDoc(txsCol, txData)
        .then(() => {
            setSuccessAmount(amount);
            setActiveView('success');
            setReceiptImage(null);
            form.reset();
            setTimeout(() => setActiveView('main'), 4000);
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
        setSuccessAmount(amount);
        setActiveView('success');
        form.reset();
        setTimeout(() => setActiveView('main'), 4000);
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

  const copyId = (id: string) => {
      navigator.clipboard.writeText(id);
      toast({ title: "Copied!", description: "Transaction ID copied to clipboard." });
  }

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
      <div className="space-y-4 mb-6">
        {pendingCount > 0 && activeView === 'main' && (
            <Alert className="bg-primary/5 border-primary/20 shadow-sm">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-black uppercase tracking-tight text-xs">Transaction Pending</AlertTitle>
                <AlertDescription className="text-xs font-medium">
                    You have {pendingCount} pending {pendingCount === 1 ? 'request' : 'requests'}. Our administrators are processing them for approval.
                </AlertDescription>
            </Alert>
        )}

        {walletInfo.balance < LOW_BALANCE_THRESHOLD && activeView === 'main' && (
            <Alert className="bg-amber-50 border-amber-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 font-black uppercase tracking-tight text-xs">Low Balance Warning</AlertTitle>
                <AlertDescription className="text-xs font-medium text-amber-700">
                    Your balance is below ₹{LOW_BALANCE_THRESHOLD}. Please add funds to ensure you can register for live tournaments and purchase test sets.
                </AlertDescription>
            </Alert>
        )}
      </div>

      {activeView === 'main' ? (
          <>
          <Card className="shadow-lg border-primary/10 overflow-hidden">
            <CardHeader className="text-center bg-primary/[0.02] border-b">
              <CardTitle className="text-3xl font-black text-primary italic uppercase tracking-tighter">My Wallet</CardTitle>
              <CardDescription className="font-bold">Manage your academic funds securely.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="text-center p-8 bg-primary/[0.03] border-2 border-dashed border-primary/20 rounded-[2rem] space-y-4">
                <div>
                    <p className="text-[10px] font-black text-primary tracking-widest uppercase mb-1">AVAILABLE BALANCE</p>
                    <p className="text-6xl font-black text-primary tracking-tighter">₹{formatCurrency(walletInfo.balance)}</p>
                </div>
                
                <div className="pt-4 border-t border-primary/10">
                    <p className="text-[10px] font-black text-muted-foreground tracking-widest uppercase mb-2">Your Referral Code</p>
                    <div className="flex items-center justify-center bg-background rounded-xl p-2 border border-dashed border-primary/20 w-fit mx-auto">
                        <CopyButton valueToCopy={walletInfo.referralCode} />
                    </div>
                </div>
              </div>

              {/* QUICK ACTIONS HUB */}
              <div className="space-y-3">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Quick Academic Actions</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl border-primary/10 hover:border-primary/40 hover:bg-primary/5 transition-all shadow-sm" onClick={() => setActiveView('add')}>
                          <PlusCircle className="w-6 h-6 text-primary" />
                          <span className="text-[10px] font-black uppercase tracking-tight">Add Funds</span>
                      </Button>
                      <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl border-accent/10 hover:border-accent/40 hover:bg-accent/5 transition-all shadow-sm" onClick={() => setActiveView('withdraw')}>
                          <MinusCircle className="w-6 h-6 text-accent" />
                          <span className="text-[10px] font-black uppercase tracking-tight">Withdraw</span>
                      </Button>
                      <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl border-primary/10 hover:border-primary/40 hover:bg-primary/5 transition-all shadow-sm" asChild>
                          <Link href="/transactions">
                             <History className="w-6 h-6 text-muted-foreground" />
                             <span className="text-[10px] font-black uppercase tracking-tight">History</span>
                          </Link>
                      </Button>
                      <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl border-primary/10 hover:border-primary/40 hover:bg-primary/5 transition-all shadow-sm" asChild>
                          <Link href="/iba/dashboard">
                             <ShieldCheck className="w-6 h-6 text-primary" />
                             <span className="text-[10px] font-black uppercase tracking-tight">IBA Hub</span>
                          </Link>
                      </Button>
                  </div>
              </div>

              {/* ENGAGEMENT ACTIONS HUB */}
              <div className="space-y-3">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Increase Your Earnings</p>
                  <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-20 flex-row gap-3 rounded-2xl border-accent/10 hover:border-accent/40 hover:bg-accent/5 transition-all shadow-sm justify-start px-6" asChild>
                          <Link href="/refer">
                             <Users className="w-6 h-6 text-accent" />
                             <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-tight">Refer a Friend</p>
                                <p className="text-[8px] text-muted-foreground font-bold">EARN ₹5 BONUS</p>
                             </div>
                          </Link>
                      </Button>
                      <Button variant="outline" className="h-20 flex-row gap-3 rounded-2xl border-primary/10 hover:border-primary/40 hover:bg-primary/5 transition-all shadow-sm justify-start px-6" asChild>
                          <Link href="/store">
                             <Store className="w-6 h-6 text-primary" />
                             <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-tight">Visit Store</p>
                                <p className="text-[8px] text-muted-foreground font-bold">BUY MOCK TESTS</p>
                             </div>
                          </Link>
                      </Button>
                  </div>
              </div>

              {/* ANALYTICS SECTION */}
              <div className="grid grid-cols-1 gap-4">
                  {pieData.length > 0 && (
                    <Card className="border-none bg-muted/20 shadow-inner rounded-3xl">
                        <CardHeader className="pb-0 text-center">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
                                <PieChartIcon className="w-3 h-3" /> Cash Flow Categories
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
                                        formatter={(value: number) => [`₹${formatCurrency(value)}`, "Total"]}
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

                  {trendData.length > 0 && (
                    <>
                    <Card className="border-none bg-muted/20 shadow-inner rounded-3xl">
                        <CardHeader className="pb-0 text-center">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
                                <LineChartIcon className="w-3 h-3" /> Balance History (Last 30 Days)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[200px] pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                    <XAxis 
                                        dataKey="date" 
                                        fontSize={8} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        minTickGap={30}
                                    />
                                    <YAxis hide />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                                        formatter={(value: number) => [`₹${formatCurrency(value)}`, "Balance"]}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="balance" 
                                        stroke="hsl(var(--primary))" 
                                        fillOpacity={1} 
                                        fill="url(#colorBalance)" 
                                        strokeWidth={3}
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-muted/20 shadow-inner rounded-3xl">
                        <CardHeader className="pb-0 text-center">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
                                <TrendingUp className="w-3 h-3" /> Activity Trends (Last 30 Days)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[200px] pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                    <XAxis 
                                        dataKey="date" 
                                        fontSize={8} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        minTickGap={30}
                                    />
                                    <YAxis hide />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                                        formatter={(value: number) => [`₹${formatCurrency(value)}`, "Amount"]}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="income" 
                                        name="Income"
                                        stroke="hsl(var(--primary))" 
                                        strokeWidth={3} 
                                        dot={false} 
                                        animationDuration={1500}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="spending" 
                                        name="Spending"
                                        stroke="hsl(var(--accent))" 
                                        strokeWidth={3} 
                                        dot={false} 
                                        animationDuration={1500}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    </>
                  )}
              </div>
              
              <div className="space-y-4 pt-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Recent Activity</h3>
                {transactions.slice(0, 8).map((tx) => (
                     <div key={tx.id} onClick={() => setSelectedTx(tx)} className="flex items-center justify-between p-4 bg-muted/30 border rounded-2xl cursor-pointer hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-full ${tx.amount >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {tx.amount >= 0 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="font-bold text-sm group-hover:text-primary transition-colors">{tx.description}</p>
                                <p className="text-[10px] text-muted-foreground">{format(new Date(tx.date), 'PP p')}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`font-black text-sm ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.amount >= 0 ? '+' : '-'} ₹{formatCurrency(Math.abs(tx.amount))}
                            </p>
                            <Badge variant={getStatusBadgeVariant(tx.status)} className="text-[9px] h-4">{tx.status}</Badge>
                        </div>
                     </div>
                ))}
                {transactions.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed rounded-3xl opacity-50">
                        <History className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-bold">No transactions found</p>
                    </div>
                )}
              </div>
            </CardContent>
             <CardFooter className="bg-muted/10 border-t">
                <Button asChild variant="ghost" className="w-full text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary">
                    <Link href="/transactions"><History className="mr-2 h-4 w-4" /> View Detailed Statement</Link>
                </Button>
             </CardFooter>
          </Card>
          </>
      ) : activeView === 'add' ? (
          <Card className="shadow-2xl border-primary/20 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
              <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-black text-primary uppercase italic tracking-tighter">Add Funds</CardTitle>
                    <CardDescription className="font-bold">Follow steps to top-up your wallet.</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setActiveView('main')} className="rounded-full">
                      <X size={20}/>
                  </Button>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="flex flex-col gap-3">
                    <Button 
                        variant="secondary" 
                        className="w-full h-14 font-black gap-2 shadow-lg border-2 border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary"
                        onClick={handleStartScanner}
                        disabled={isScannerOpen}
                    >
                        <Scan className="w-5 h-5" />
                        LAUNCH QR SCANNER
                    </Button>

                    {isScannerOpen && (
                        <div className="relative border-4 border-primary/20 rounded-[2rem] overflow-hidden bg-black aspect-square">
                            <div id={scannerId} className="w-full h-full" />
                            <div className="absolute inset-0 border-[20px] border-black/40 pointer-events-none">
                                <div className="w-full h-full border-2 border-white/50 rounded-2xl" />
                            </div>
                            <Button 
                                variant="destructive" 
                                size="icon" 
                                className="absolute top-4 right-4 rounded-full shadow-xl"
                                onClick={handleStopScanner}
                            >
                                <X size={20} />
                            </Button>
                            <div className="absolute bottom-4 left-0 right-0 text-center">
                                <Badge className="bg-white/20 text-white border-none animate-pulse px-4 py-1">Position QR in frame</Badge>
                            </div>
                        </div>
                    )}
                </div>

                <Tabs defaultValue="upi" className="w-full">
                    <TabsList className="grid grid-cols-2 h-12">
                        <TabsTrigger value="upi" className="font-black uppercase text-[10px]">UPI / QR</TabsTrigger>
                        <TabsTrigger value="bank" className="font-black uppercase text-[10px]">Bank Transfer</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upi" className="pt-6 space-y-6">
                        {adminPaymentMethods.qrCodeUrl && (
                            <div className="flex flex-col items-center gap-2">
                                <div className="p-4 bg-muted/30 rounded-3xl border-2 border-dashed border-primary/20 shadow-inner">
                                    <Image src={adminPaymentMethods.qrCodeUrl} alt="QR Code" width={250} height={250} className="rounded-xl" />
                                </div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground italic tracking-widest">Administrator Payment QR</p>
                            </div>
                        )}
                        <div className="space-y-2 text-sm bg-muted/20 p-4 rounded-2xl border">
                            <div className="flex justify-between items-center"><span className="font-bold text-muted-foreground uppercase text-[10px]">Merchant UPI ID</span><CopyButton valueToCopy={adminPaymentMethods.upiId} /></div>
                            {adminPaymentMethods.gpayUpiId && (
                                <div className="flex justify-between items-center pt-2 border-t border-dashed border-primary/10">
                                    <span className="font-bold text-muted-foreground uppercase text-[10px]">GPay UPI ID</span>
                                    <CopyButton valueToCopy={adminPaymentMethods.gpayUpiId} />
                                </div>
                            )}
                            {adminPaymentMethods.phonepeUpiId && (
                                <div className="flex justify-between items-center pt-2 border-t border-dashed border-primary/10">
                                    <span className="font-bold text-muted-foreground uppercase text-[10px]">PhonePe UPI ID</span>
                                    <CopyButton valueToCopy={adminPaymentMethods.phonepeUpiId} />
                                </div>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="bank" className="pt-6 space-y-3">
                         <div className="flex justify-between items-center p-4 bg-muted/20 rounded-2xl border">
                             <span className="font-bold text-muted-foreground uppercase text-[10px]">Account Holder</span>
                             <CopyButton valueToCopy={adminPaymentMethods.accountHolderName} />
                         </div>
                         <div className="flex justify-between items-center p-4 bg-muted/20 rounded-2xl border">
                             <span className="font-bold text-muted-foreground uppercase text-[10px]">Bank Name</span>
                             <CopyButton valueToCopy={adminPaymentMethods.bankName} />
                         </div>
                         <div className="flex justify-between items-center p-4 bg-muted/20 rounded-2xl border">
                             <span className="font-bold text-muted-foreground uppercase text-[10px]">Account Number</span>
                             <CopyButton valueToCopy={adminPaymentMethods.accountNumber} />
                         </div>
                         <div className="flex justify-between items-center p-4 bg-muted/20 rounded-2xl border">
                             <span className="font-bold text-muted-foreground uppercase text-[10px]">IFSC Code</span>
                             <CopyButton valueToCopy={adminPaymentMethods.ifscCode} />
                         </div>
                    </TabsContent>
                </Tabs>

                <form onSubmit={handleAddFunds} className="space-y-4 border-t pt-8">
                    <div className="space-y-2">
                        <Label htmlFor="amount-add" className="font-black uppercase text-[10px] text-muted-foreground">Amount Paid (INR)</Label>
                        <Input id="amount-add" name="amount-add" type="number" required placeholder="e.g., 3000" className="h-14 text-lg font-bold rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="txnId" className="font-black uppercase text-[10px] text-muted-foreground">Transaction ID / UTR</Label>
                        <Input id="txnId" name="txnId" required placeholder="12-digit number from receipt" className="h-14 font-mono text-center tracking-widest text-lg rounded-2xl" />
                    </div>
                    
                    <div className="space-y-4">
                        <Label className="font-black uppercase text-[10px] text-muted-foreground">Payment Receipt Image</Label>
                        <div className="flex flex-col gap-3">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleFileChange}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="h-20 flex-col gap-2 rounded-2xl border-dashed border-2 hover:bg-primary/5"
                                    onClick={() => {
                                        if (fileInputRef.current) {
                                            fileInputRef.current.removeAttribute('capture');
                                            fileInputRef.current.click();
                                        }
                                    }}
                                >
                                    <ImageIcon className="w-5 h-5 text-primary" />
                                    <span className="text-[9px] font-black uppercase">Upload Gallery</span>
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="h-20 flex-col gap-2 rounded-2xl border-dashed border-2 hover:bg-accent/5"
                                    onClick={() => {
                                        if (fileInputRef.current) {
                                            fileInputRef.current.setAttribute('capture', 'environment');
                                            fileInputRef.current.click();
                                        }
                                    }}
                                >
                                    <Camera className="w-5 h-5 text-accent" />
                                    <span className="text-[9px] font-black uppercase">Take Photo</span>
                                </Button>
                            </div>
                            
                            {receiptImage && (
                                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg group">
                                    <Image src={receiptImage} alt="Receipt Preview" fill className="object-contain bg-muted/20" />
                                    <Button 
                                        type="button" 
                                        variant="destructive" 
                                        size="icon" 
                                        className="absolute top-2 right-2 rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => setReceiptImage(null)}
                                    >
                                        <X size={16} />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 grid gap-3">
                        <Button type="submit" className="w-full py-8 text-xl font-black shadow-2xl rounded-2xl">SUBMIT DEPOSIT REQUEST</Button>
                        <Button type="button" variant="ghost" className="w-full font-bold uppercase text-[10px] tracking-widest" onClick={() => { setActiveView('main'); setReceiptImage(null); }}>
                           <ArrowLeft className="mr-2 h-3 w-3" /> Cancel & Return
                        </Button>
                    </div>
                </form>
            </CardContent>
          </Card>
      ) : activeView === 'withdraw' ? (
          <Card className="shadow-2xl border-accent/20 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
             <CardHeader className="bg-accent/5 border-b flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-black text-accent uppercase italic tracking-tighter">Request Payout</CardTitle>
                    <CardDescription className="font-bold">Minimum withdrawal amount is ₹200.</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setActiveView('main')} className="rounded-full">
                      <X size={20}/>
                  </Button>
              </CardHeader>
              <CardContent className="pt-8">
                <form onSubmit={handleWithdraw} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="amount-withdraw" className="font-black uppercase text-[10px] text-muted-foreground">Withdrawal Amount (INR)</Label>
                        <Input id="amount-withdraw" name="amount-withdraw" type="number" required min="200" placeholder="Min. 200" className="h-14 text-2xl font-black rounded-2xl text-accent" />
                        <p className="text-[10px] text-muted-foreground italic">Available: ₹{formatCurrency(walletInfo.balance)}</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="upiId" className="font-black uppercase text-[10px] text-muted-foreground">Receiving UPI ID</Label>
                        <Input id="upiId" name="upiId" required placeholder="yourname@bank" className="h-14 font-bold rounded-2xl" />
                    </div>
                    <div className="pt-4 grid gap-3">
                        <Button type="submit" className="w-full py-8 text-xl font-black shadow-2xl rounded-2xl bg-accent hover:bg-accent/90">REQUEST PAYOUT</Button>
                        <Button type="button" variant="ghost" className="w-full font-bold uppercase text-[10px] tracking-widest" onClick={() => setActiveView('main')}>
                           <ArrowLeft className="mr-2 h-3 w-3" /> Cancel & Return
                        </Button>
                    </div>
                </form>
              </CardContent>
          </Card>
      ) : (
          <Card className="shadow-2xl border-green-500/20 overflow-hidden animate-in fade-in zoom-in duration-500">
              <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center space-y-8">
                  <div className="relative">
                      <div className="absolute -inset-4 bg-green-500/20 rounded-full blur-2xl animate-pulse" />
                      <CheckCircle className="w-24 h-24 text-green-500 relative z-10 animate-in zoom-in spin-in-12 duration-700" />
                  </div>
                  <div className="space-y-2">
                      <h2 className="text-3xl font-black tracking-tighter uppercase italic text-primary">Request Submitted!</h2>
                      <p className="text-muted-foreground font-medium">Your request for ₹{formatCurrency(successAmount)} has been queued for academic administration review.</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-6 py-1.5 font-black uppercase tracking-widest">
                      PENDING APPROVAL
                  </Badge>
                  <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest opacity-50" onClick={() => setActiveView('main')}>
                      Returning to Wallet...
                  </Button>
              </CardContent>
          </Card>
      )}

      {/* Transaction Detail Receipt Modal */}
      <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
          <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
              {selectedTx && (
                  <div className="bg-background">
                      <div className={cn(
                          "p-8 text-center relative",
                          selectedTx.status === 'Completed' ? "bg-green-500/10" : 
                          selectedTx.status === 'Rejected' ? "bg-red-500/10" : "bg-amber-500/10"
                      )}>
                          <div className="flex justify-center mb-4">
                              <div className={cn(
                                  "w-16 h-16 rounded-full flex items-center justify-center shadow-lg",
                                  selectedTx.status === 'Completed' ? "bg-green-500 text-white" : 
                                  selectedTx.status === 'Rejected' ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                              )}>
                                  {selectedTx.amount >= 0 ? <ArrowDownLeft size={32}/> : <ArrowUpRight size={32}/>}
                              </div>
                          </div>
                          <h2 className="text-3xl font-black tracking-tighter uppercase italic">
                              {selectedTx.amount >= 0 ? "Credit Received" : "Debit Processed"}
                          </h2>
                          <div className="mt-2 flex items-center justify-center gap-2">
                              {getStatusIcon(selectedTx.status)}
                              <Badge variant={getStatusBadgeVariant(selectedTx.status)} className="font-black uppercase tracking-widest text-[10px]">
                                  {selectedTx.status}
                              </Badge>
                          </div>
                      </div>

                      <div className="p-8 space-y-6">
                          <div className="text-center">
                              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">Transaction Amount</p>
                              <p className={cn(
                                  "text-5xl font-black tracking-tighter",
                                  selectedTx.amount >= 0 ? "text-green-600" : "text-red-600"
                              )}>
                                  ₹{formatCurrency(Math.abs(selectedTx.amount))}
                              </p>
                          </div>

                          <div className="space-y-4 pt-4 border-t border-dashed">
                              <div className="flex justify-between items-start">
                                  <p className="text-[10px] font-black uppercase text-muted-foreground">Description</p>
                                  <p className="text-sm font-bold text-right max-w-[200px]">{selectedTx.description}</p>
                              </div>
                              <div className="flex justify-between items-center">
                                  <p className="text-[10px] font-black uppercase text-muted-foreground">Date & Time</p>
                                  <p className="text-sm font-bold">{format(new Date(selectedTx.date), 'PPP p')}</p>
                              </div>
                              <div className="flex justify-between items-center">
                                  <p className="text-[10px] font-black uppercase text-muted-foreground">Type</p>
                                  <Badge variant="outline" className="text-[9px] font-bold uppercase">{selectedTx.type}</Badge>
                              </div>
                              {selectedTx.referenceId && (
                                  <div className="flex justify-between items-center">
                                      <p className="text-[10px] font-black uppercase text-muted-foreground">Ref / UTR</p>
                                      <p className="text-sm font-mono font-bold">{selectedTx.referenceId}</p>
                                  </div>
                              )}
                              {selectedTx.referenceId && (
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground">Copy UTR</p>
                                    <CopyButton valueToCopy={selectedTx.referenceId} />
                                </div>
                              )}
                              {selectedTx.paymentMethod && (
                                  <div className="flex justify-between items-center">
                                      <p className="text-[10px] font-black uppercase text-muted-foreground">Payout To</p>
                                      <p className="text-sm font-bold">{selectedTx.paymentMethod}</p>
                                  </div>
                              )}
                          </div>
                          
                          {selectedTx.receiptUrl && (
                              <div className="pt-6 border-t">
                                  <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Payment Receipt</p>
                                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border bg-muted/20">
                                      <Image src={selectedTx.receiptUrl} alt="Receipt" fill className="object-contain" />
                                  </div>
                              </div>
                          )}

                          <div className="pt-6 border-t">
                               <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Transaction ID</p>
                               <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-dashed">
                                   <code className="text-[10px] font-mono break-all pr-4">{selectedTx.id}</code>
                                   <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyId(String(selectedTx.id))}>
                                       <Copy size={14}/>
                                   </Button>
                               </div>
                          </div>
                      </div>

                      <div className="p-6 bg-muted/30 flex justify-center">
                          <Button variant="outline" className="w-full font-black uppercase tracking-tight rounded-xl" onClick={() => setSelectedTx(null)}>
                              Dismiss Receipt
                          </Button>
                      </div>
                  </div>
              )}
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
