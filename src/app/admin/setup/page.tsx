
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDb, useAuthService } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, runTransaction, getDocs, collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Shield, RefreshCcw, AlertTriangle, ExternalLink, Database } from 'lucide-react';
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

  const ensureRecords = async (uid: string, type: 'admin' | 'student') => {
    if (!db) throw new Error("Database not initialized");
    await runTransaction(db, async (transaction) => {
      const userDocRef = doc(db, "users", uid);
      const walletDocRef = doc(db, "wallets", uid);
      const adminDocRef = doc(db, "admins", uid);

      transaction.set(userDocRef, {
        id: uid,
        name: type === 'admin' ? HEAD_ADMIN_NAME : TEST_USER_NAME,
        email: type === 'admin' ? HEAD_ADMIN_EMAIL : TEST_USER_EMAIL,
        phone: type === 'admin' ? HEAD_ADMIN_PHONE : "0000000000",
        joinDate: new Date().toISOString(),
        status: "Active",
      }, { merge: true });

      transaction.set(walletDocRef, {
        balance: type === 'admin' ? 0 : 1000,
        coins: 100,
        referralCode: type === 'admin' ? 'HEADADMIN' : `REF${uid.slice(0, 6).toUpperCase()}`
      }, { merge: true });

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
        transaction.delete(adminDocRef);
      }
    });

    if (typeof window !== 'undefined') {
        sessionStorage.clear();
    }
  };

  const handleError = (error: any) => {
    console.error(error);
    const msg = error.message || "An unexpected error occurred.";
    if (msg.includes("database (default) does not exist") || msg.includes("vidyaeducaredatabase") || msg.includes("not exist") || msg.includes("Datastore or Cloud Firestore database")) {
        setIsDatabaseMissing(true);
        setErrorMessage("Ensure the Firestore database exists and the name 'vidyaeducaredatabase' is correctly configured.");
    } else {
        setErrorMessage(msg);
    }
    setStatus('error');
  };

  const createHeadAdmin = async () => {
    if (!db || !auth) return;
    setStatus('loading');
    setIsDatabaseMissing(false);
    
    try {
        let uid = '';
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, HEAD_ADMIN_EMAIL, HEAD_ADMIN_PASSWORD);
            uid = userCredential.user.uid;
        } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
                try {
                    const signInRes = await signInWithEmailAndPassword(auth, HEAD_ADMIN_EMAIL, HEAD_ADMIN_PASSWORD);
                    uid = signInRes.user.uid;
                } catch (signInErr) {
                    const q = query(collection(db, "users"), where("email", "==", HEAD_ADMIN_EMAIL));
                    const snap = await getDocs(q);
                    if (!snap.empty) uid = snap.docs[0].id;
                    else throw new Error("Account exists but profile mapping failed.");
                }
            } else throw e;
        }

        await ensureRecords(uid, 'admin');
        setStatus('success');
        toast({ title: "Admin Mapping Established", description: "Master credentials synchronized." });
    } catch (error: any) {
        handleError(error);
    }
  };

  const createTestUser = async () => {
    if (!db || !auth) return;
    setIsCreatingUser(true);
    setIsDatabaseMissing(false);
    
    try {
        let uid = '';
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, TEST_USER_EMAIL, TEST_USER_PASSWORD);
            uid = userCredential.user.uid;
        } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
                try {
                    const signInRes = await signInWithEmailAndPassword(auth, TEST_USER_EMAIL, TEST_USER_PASSWORD);
                    uid = signInRes.user.uid;
                } catch (signInErr) {
                    const q = query(collection(db, "users"), where("email", "==", TEST_USER_EMAIL));
                    const snap = await getDocs(q);
                    if (!snap.empty) uid = snap.docs[0].id;
                    else throw new Error("Student exists but lookup failed.");
                }
            } else throw e;
        }

        await ensureRecords(uid, 'student');
        toast({ title: "Student Access Restored", description: "Mapping verified." });
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
            Definitively map accounts to their administrative or student roles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {isDatabaseMissing && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-bold">Database Connectivity Alert</AlertTitle>
                <AlertDescription className="text-xs space-y-3">
                    <p>The system is trying to connect to <b>vidyaeducaredatabase</b>. If this error persists, ensure your database name exactly matches this string in the Firebase Console.</p>
                    <Button asChild variant="destructive" size="sm" className="w-full font-bold">
                        <a href="https://console.firebase.google.com/project/vidyaeducare/firestore" target="_blank" rel="noopener noreferrer">
                            OPEN FIRESTORE CONSOLE <ExternalLink className="ml-2 h-3 w-3" />
                        </a>
                    </Button>
                </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground border-b pb-2 flex items-center gap-2">
                <Database size={12}/> Target: vidyaeducaredatabase
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
                    <Button variant="outline" size="sm" className="w-full mt-4 font-bold" onClick={() => setStatus('idle')}>Retry Mapping</Button>
                </div>
            ) : (
                <Button className="w-full py-6 text-lg font-black shadow-lg" onClick={createHeadAdmin} disabled={status === 'loading'}>
                    {status === 'loading' ? <Loader2 className="animate-spin mr-2" /> : <Shield className="mr-2 h-5 w-5" />}
                    SYNC ADMIN PROFILE
                </Button>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t">
            <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground border-b pb-2">Student Mapping</h3>
            <div className="bg-muted p-4 rounded-xl space-y-3">
                <div className="text-xs font-mono bg-background p-3 rounded-lg border border-dashed text-center">
                    {TEST_USER_EMAIL}
                </div>
                <Button variant="secondary" className="w-full font-bold" onClick={createTestUser} disabled={isCreatingUser}>
                    {isCreatingUser ? <Loader2 className="animate-spin mr-2" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                    SYNC TEST STUDENT
                </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-primary/5 py-4 border-t justify-center">
            <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Using Database: vidyaeducaredatabase</p>
        </CardFooter>
      </Card>
    </div>
  );
}
