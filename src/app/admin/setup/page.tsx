'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDb, useAuthService } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, runTransaction, getDocs, collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Shield, RefreshCcw, AlertTriangle, ExternalLink, Database, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const HEAD_ADMIN_EMAIL = 'admin@vidyaeducare.com';
const HEAD_ADMIN_PASSWORD = 'password123';
const HEAD_ADMIN_NAME = 'Main Admin';
const HEAD_ADMIN_PHONE = '9999999999';

const TEST_USER_EMAIL = 'student@vidyaeducare.com';
const TEST_USER_PASSWORD = 'password123';
const TEST_USER_NAME = 'Test User';

export default function SetupAdminPage() {
  const db = useDb();
  const auth = useAuthService();
  const router = useRouter();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDatabaseMissing, setIsDatabaseMissing] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Diagnostic Data
  const targetProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const targetDbId = "vidyaeducaredatabase";

  const ensureRecords = async (uid: string, type: 'admin' | 'student') => {
    if (!db) throw new Error("Database not initialized");
    
    await runTransaction(db, async (transaction) => {
      const userDocRef = doc(db, "users", uid);
      const walletDocRef = doc(db, "wallets", uid);
      const adminDocRef = doc(db, "admins", uid);

      // 1. Set User Profile
      transaction.set(userDocRef, {
        id: uid,
        name: type === 'admin' ? HEAD_ADMIN_NAME : TEST_USER_NAME,
        email: type === 'admin' ? HEAD_ADMIN_EMAIL : TEST_USER_EMAIL,
        phone: type === 'admin' ? HEAD_ADMIN_PHONE : "0000000000",
        joinDate: new Date().toISOString(),
        status: "Active",
      }, { merge: true });

      // 2. Set Wallet
      transaction.set(walletDocRef, {
        balance: type === 'admin' ? 0 : 1000,
        coins: 100,
        referralCode: type === 'admin' ? 'HEADADMIN' : `REF${uid.slice(0, 6).toUpperCase()}`
      }, { merge: true });

      // 3. Set or Clear Admin Permissions
      if (type === 'admin') {
        transaction.set(adminDocRef, {
          name: HEAD_ADMIN_NAME, 
          email: HEAD_ADMIN_EMAIL, 
          phone: HEAD_ADMIN_PHONE,
          role: "Head Admin", 
          status: "Active", 
          joinDate: new Date().toISOString(),
        }, { merge: true });
      } else {
        // If syncing a student, we explicitly remove them from admins collection
        transaction.delete(adminDocRef);
      }
    });

    if (typeof window !== 'undefined') {
        sessionStorage.clear();
    }
  };

  const handleError = (error: any) => {
    console.error("Setup Error Details:", error);
    const msg = error.message || "An unexpected error occurred.";
    
    if (msg.includes("Native mode API is disabled") || msg.includes("Datastore mode") || msg.includes("Native mode")) {
        setIsDatabaseMissing(true);
        setErrorMessage("CRITICAL: Infrastructure Mismatch. Ensure 'vidyaeducaredatabase' is created in 'Firestore Native' mode.");
    } else if (msg.includes("database (default) does not exist") || msg.includes("not exist")) {
        setIsDatabaseMissing(true);
        setErrorMessage(`Database '${targetDbId}' not found. Check console.`);
    } else if (msg.includes("Missing or insufficient permissions")) {
        setErrorMessage("Permission Denied. Ensure you are 'Syncing' while logged in as admin@vidyaeducare.com.");
    } else {
        setErrorMessage(msg);
    }
    setStatus('error');
  };

  const createHeadAdmin = async () => {
    if (!db || !auth) return;
    setStatus('loading');
    setIsDatabaseMissing(false);
    setErrorMessage('');
    
    try {
        let uid = '';
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, HEAD_ADMIN_EMAIL, HEAD_ADMIN_PASSWORD);
            uid = userCredential.user.uid;
        } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
                const signInRes = await signInWithEmailAndPassword(auth, HEAD_ADMIN_EMAIL, HEAD_ADMIN_PASSWORD);
                uid = signInRes.user.uid;
            } else throw e;
        }

        // Token propagation buffer
        await new Promise(r => setTimeout(r, 800));

        await ensureRecords(uid, 'admin');
        setStatus('success');
        toast({ title: "Admin Mapping Verified", description: "Identity synchronized with master credentials." });
    } catch (error: any) {
        handleError(error);
    }
  };

  const createTestUser = async () => {
    if (!db || !auth) return;
    setIsCreatingUser(true);
    setIsDatabaseMissing(false);
    setErrorMessage('');
    
    try {
        let uid = '';
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, TEST_USER_EMAIL, TEST_USER_PASSWORD);
            uid = userCredential.user.uid;
        } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
                const signInRes = await signInWithEmailAndPassword(auth, TEST_USER_EMAIL, TEST_USER_PASSWORD);
                uid = signInRes.user.uid;
            } else throw e;
        }

        await new Promise(r => setTimeout(r, 800));

        await ensureRecords(uid, 'student');
        toast({ title: "Student Access Restored", description: "Test profile mapping verified." });
    } catch (error: any) {
        handleError(error);
    } finally {
        setIsCreatingUser(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-black flex items-center justify-center gap-2 text-primary">
            <Shield className="w-6 h-6" /> ROLE INITIALIZATION
          </CardTitle>
          <CardDescription>
            Map accounts to their administrative or student roles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-2">
              <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                  <Database size={12}/> Connectivity Diagnostics
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="text-muted-foreground">Project:</div>
                  <div className="font-bold truncate">{targetProjectId}</div>
                  <div className="text-muted-foreground">Database:</div>
                  <div className="font-bold">{targetDbId}</div>
              </div>
          </div>

          {isDatabaseMissing && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-bold text-xs uppercase tracking-tight">Infrastructure Configuration Error</AlertTitle>
                <AlertDescription className="text-xs space-y-3 mt-2">
                    <p>{errorMessage}</p>
                    <div className="bg-background/80 p-3 rounded border font-sans space-y-2">
                      <p className="font-bold text-primary italic">Required Action:</p>
                      <ol className="list-decimal list-inside space-y-1 opacity-80">
                        <li>Go to Firebase Console (Firestore).</li>
                        <li>Verify <b>Database ID</b> is exactly <b>{targetDbId}</b></li>
                        <li>Ensure it was created in <b>Native mode</b>.</li>
                      </ol>
                    </div>
                    <Button asChild variant="destructive" size="sm" className="w-full font-bold">
                        <a href={`https://console.firebase.google.com/project/${targetProjectId}/firestore/databases`} target="_blank" rel="noopener noreferrer">
                            VERIFY IN CONSOLE <ExternalLink className="ml-2 h-3 w-3" />
                        </a>
                    </Button>
                </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground border-b pb-2 flex items-center gap-2">
                Administrator Access
            </h3>
            {status === 'success' ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-black text-sm uppercase">Mapping Verified</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full font-bold" onClick={() => router.push('/admin/login')}>Enter Admin Portal</Button>
                </div>
            ) : status === 'error' && !isDatabaseMissing ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 p-4 rounded-xl">
                    <p className="text-xs font-bold text-red-700">{errorMessage}</p>
                    <Button variant="outline" size="sm" className="w-full mt-4 font-bold" onClick={() => setStatus('idle')}>Retry Sync</Button>
                </div>
            ) : (
                <Button className="w-full py-6 text-lg font-black shadow-lg" onClick={createHeadAdmin} disabled={status === 'loading' || isDatabaseMissing}>
                    {status === 'loading' ? <Loader2 className="animate-spin mr-2" /> : <Shield className="mr-2 h-5 w-5" />}
                    SYNC ADMIN PROFILE
                </Button>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t">
            <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground border-b pb-2">Student Access</h3>
            <div className="bg-muted p-4 rounded-xl space-y-3">
                <div className="text-xs font-mono bg-background p-3 rounded-lg border border-dashed text-center">
                    {TEST_USER_EMAIL}
                </div>
                <Button variant="secondary" className="w-full font-bold" onClick={createTestUser} disabled={isCreatingUser || isDatabaseMissing}>
                    {isCreatingUser ? <Loader2 className="animate-spin mr-2" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                    SYNC TEST STUDENT
                </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-primary/5 py-4 border-t justify-center gap-2">
            <Info size={10} className="text-muted-foreground"/>
            <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Custom Database: {targetDbId}</p>
        </CardFooter>
      </Card>
    </div>
  );
}