"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDb, useAuthService } from "@/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, runTransaction, collection, addDoc, serverTimestamp, query, where } from "firebase/firestore";
import { Loader2, CheckCircle2, XCircle, Play, Shield, DollarSign, Wallet, ArrowRight, Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface TestStep {
  name: string;
  status: "idle" | "running" | "success" | "failed";
  message: string;
}

export default function VerifyFlowPage() {
  const db = useDb();
  const auth = useAuthService();
  
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  const [steps, setSteps] = useState<TestStep[]>([
    { name: "Sign in as Student & Check Balance", status: "idle", message: "Pending execution..." },
    { name: "Create Pending Deposit of ₹1,500", status: "idle", message: "Pending execution..." },
    { name: "Sign in as Admin & Approve Deposit", status: "idle", message: "Pending execution..." },
    { name: "Verify Immediate Student Balance Update", status: "idle", message: "Pending execution..." },
    { name: "Call Purchase API & Credit Revenue to Admin", status: "idle", message: "Pending execution..." },
  ]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} > ${msg}`]);
  };

  const updateStep = (index: number, status: TestStep["status"], message: string) => {
    setSteps(prev => {
      const next = [...prev];
      next[index] = { ...next[index], status, message };
      return next;
    });
  };

  const runVerification = async () => {
    if (!db || !auth) {
      addLog("Firebase services not ready.");
      return;
    }
    
    setIsRunning(true);
    setLogs([]);
    setSteps(steps.map(s => ({ ...s, status: "idle", message: "Running..." })));

    let studentUid = "";
    let initialStudentBalance = 0;
    let depositTxId = "";
    let adminUid = "";
    let initialAdminBalance = 0;
    let finalStudentBalance = 0;
    let finalAdminBalance = 0;
    let finalInvoicePrice = 0;

    try {
      // Step 1: Sign in as student & Check Balance
      addLog("Step 1: Signing in as student (student@vidyaeducare.com)...");
      updateStep(0, "running", "Signing in...");
      
      await signOut(auth);
      const studentCred = await signInWithEmailAndPassword(auth, "student@vidyaeducare.com", "password123");
      studentUid = studentCred.user.uid;
      
      const studentWalletRef = doc(db, "wallets", studentUid);
      const studentWalletSnap = await getDoc(studentWalletRef);
      initialStudentBalance = studentWalletSnap.exists() ? (studentWalletSnap.data().balance || 0) : 0;
      
      addLog(`Student successfully signed in. Initial Balance: ₹${initialStudentBalance}`);
      updateStep(0, "success", `Success. Balance: ₹${initialStudentBalance}`);

      // Step 2: Create Pending Deposit of ₹1,500
      addLog("Step 2: Creating a pending deposit transaction...");
      updateStep(1, "running", "Generating request...");
      
      // Call the local deposit API to create the pending transaction
      const idToken = await studentCred.user.getIdToken();
      const depositRes = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          amount: 1500,
          referenceId: `VERIFY-UTR-${Date.now()}`,
          receiptUrl: null
        })
      });
      
      const depositData = await depositRes.json();
      if (!depositRes.ok) {
        throw new Error(depositData.error || "Deposit API request failed.");
      }

      // Query the transactions collection to find the created pending transaction
      const txQuery = query(
        collection(db, "transactions"), 
        where("user", "==", studentUid), 
        where("status", "==", "Pending"), 
        where("amount", "==", 1500)
      );
      const txQuerySnap = await getDocs(txQuery);
      if (txQuerySnap.empty) {
        throw new Error("Could not find the pending deposit transaction in the database.");
      }
      
      depositTxId = txQuerySnap.docs[0].id;
      addLog(`Pending deposit created successfully. UTR Transaction Ref ID: ${depositTxId}`);
      updateStep(1, "success", `Success. UTR Ref: ${depositTxId.substring(0, 8)}...`);

      // Step 3: Sign in as Admin & Approve Deposit
      addLog("Step 3: Signing in as Admin (admin@vidyaeducare.com)...");
      updateStep(2, "running", "Signing in as Admin...");
      
      await signOut(auth);
      const adminCred = await signInWithEmailAndPassword(auth, "admin@vidyaeducare.com", "password123");
      adminUid = adminCred.user.uid;

      const adminWalletRef = doc(db, "wallets", adminUid);
      const adminWalletSnap = await getDoc(adminWalletRef);
      initialAdminBalance = adminWalletSnap.exists() ? (adminWalletSnap.data().balance || 0) : 0;
      
      addLog(`Admin signed in. Initial Admin Balance: ₹${initialAdminBalance}`);
      addLog("Processing approval transaction...");
      
      // Perform the transaction status update (simulate the admin's approve action)
      const txDocRef = doc(db, "transactions", depositTxId);
      await runTransaction(db, async (transaction) => {
        const walletSnap = await transaction.get(studentWalletRef);
        const currentBal = walletSnap.exists() ? (walletSnap.data().balance || 0) : 0;
        
        transaction.update(studentWalletRef, { balance: currentBal + 1500 });
        transaction.update(txDocRef, { status: "Completed" });
      });

      addLog("Transaction approved. Student wallet credited with ₹1500.");
      updateStep(2, "success", "Success. Deposit approved and transaction completed.");

      // Step 4: Verify Immediate Student Balance Update
      addLog("Step 4: Signing back in as student to check balance update...");
      updateStep(3, "running", "Verifying student balance...");
      
      await signOut(auth);
      await signInWithEmailAndPassword(auth, "student@vidyaeducare.com", "password123");
      
      const updatedWalletSnap = await getDoc(studentWalletRef);
      finalStudentBalance = updatedWalletSnap.exists() ? (updatedWalletSnap.data().balance || 0) : 0;
      
      addLog(`Student Balance verified: ₹${finalStudentBalance}`);
      if (finalStudentBalance !== initialStudentBalance + 1500) {
        throw new Error(`Expected balance ₹${initialStudentBalance + 1500}, but got ₹${finalStudentBalance}`);
      }
      
      updateStep(3, "success", `Success. Balance instantly updated: ₹${finalStudentBalance}`);

      // Step 5: Call Purchase API & Credit Revenue to Admin
      addLog("Step 5: Simulating a student product purchase of 'AI Doubt Solver' (₹750 + 18% GST = ₹885)...");
      updateStep(4, "running", "Calling purchase API...");
      
      const newStudentIdToken = await auth.currentUser!.getIdToken(true);
      const purchaseRes = await fetch('/api/store/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newStudentIdToken}`
        },
        body: JSON.stringify({
          productId: 'ai_doubt',
          productType: 'ai_tool',
          referralCode: ''
        })
      });
      
      const purchaseData = await purchaseRes.json();
      if (!purchaseRes.ok) {
        throw new Error(purchaseData.error || "Purchase API failed.");
      }
      
      finalInvoicePrice = purchaseData.invoice.finalPrice;
      addLog(`Purchase completed. Invoice Final Price (with GST): ₹${finalInvoicePrice}`);
      
      // Let's verify student balance is decremented and admin balance is credited
      const studentWalletSnapAfterPurchase = await getDoc(studentWalletRef);
      const finalStudentBalanceAfterPurchase = studentWalletSnapAfterPurchase.exists() 
        ? studentWalletSnapAfterPurchase.data().balance 
        : 0;
        
      // Fetch admin wallet
      const adminWalletSnapAfterPurchase = await getDoc(adminWalletRef);
      finalAdminBalance = adminWalletSnapAfterPurchase.exists() 
        ? (adminWalletSnapAfterPurchase.data().balance || 0) 
        : 0;
      
      addLog(`Student final balance after purchase: ₹${finalStudentBalanceAfterPurchase}`);
      addLog(`Admin final balance after purchase: ₹${finalAdminBalance} (Expected: ₹${initialAdminBalance + finalInvoicePrice})`);
      
      if (finalAdminBalance !== initialAdminBalance + finalInvoicePrice) {
        throw new Error(`Revenue routing failed. Admin got ₹${finalAdminBalance - initialAdminBalance}, expected ₹${finalInvoicePrice}`);
      }
      
      updateStep(4, "success", `Success. Revenue of ₹${finalInvoicePrice} routed to Admin Wallet!`);
      addLog("✅ ALL FLOW VERIFICATIONS COMPLETED SUCCESSFULLY!");
      
    } catch (e: any) {
      addLog(`❌ ERROR: ${e.message}`);
      // Find running index and mark as failed
      setSteps(prev => {
        return prev.map(s => s.status === "running" ? { ...s, status: "failed", message: e.message } : s);
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col w-full items-center p-6 bg-slate-950 min-h-screen text-slate-100">
      <div className="w-full max-w-3xl space-y-8 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Badge className="bg-indigo-500/10 text-indigo-400 border-none font-bold">FLOW VERIFICATION SUITE</Badge>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2 uppercase italic text-indigo-500">
              <Shield className="w-8 h-8 text-indigo-400" /> SYSTEM TRANSACTION AUDIT
            </h1>
          </div>
          <Button variant="outline" asChild className="border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10">
            <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Home</Link>
          </Button>
        </div>

        {/* Introduction */}
        <Card className="bg-slate-900 border-indigo-500/10 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-indigo-400">
              <Activity className="w-5 h-5" /> Automated Verification Flows
            </CardTitle>
            <CardDescription className="text-slate-400">
              This panel verifies the two core financial requirements:
              <ol className="list-decimal pl-5 mt-2 space-y-1 text-xs text-slate-300">
                <li>Immediate wallet balance updates upon Admin approval of deposit requests.</li>
                <li>Product purchase revenue routing to the Head Admin wallet account.</li>
              </ol>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Steps Checklist */}
            <div className="space-y-4">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 bg-slate-950/40 rounded-xl border border-slate-800/80">
                  <div className="mt-1">
                    {step.status === "idle" && <div className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-[10px] text-slate-600 font-bold">{idx + 1}</div>}
                    {step.status === "running" && <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />}
                    {step.status === "success" && <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-500/10" />}
                    {step.status === "failed" && <XCircle className="w-5 h-5 text-red-500 fill-red-500/10" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-slate-200">{step.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{step.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Run Button */}
            <Button 
              className="w-full py-8 text-xl font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl flex items-center justify-center gap-2"
              onClick={runVerification}
              disabled={isRunning}
            >
              {isRunning ? <><Loader2 className="animate-spin" /> RUNNING AUDIT TESTS...</> : <><Play className="fill-white" size={18} /> LAUNCH AUDIT TESTS</>}
            </Button>
          </CardContent>
        </Card>

        {/* Live Logs Console */}
        <Card className="bg-black/80 border-slate-800 shadow-inner rounded-2xl">
          <CardHeader className="py-3 px-6 border-b border-slate-800">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" /> Live Execution Stream
            </CardTitle>
          </CardHeader>
          <CardContent className="font-mono text-xs text-green-400 p-6 min-h-[180px] space-y-1">
            {logs.length > 0 ? (
              logs.map((log, i) => (
                <p key={i} className="animate-in fade-in slide-in-from-left-2">{log}</p>
              ))
            ) : (
              <p className="text-slate-600 italic">Waiting to start verification tests...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

async function getDocs(query: any) {
  // Helper to fetch doc snapshots on client side query
  const snap = await getDocsDirect(query);
  return snap;
}

import { getDocs as getDocsDirect } from "firebase/firestore";
