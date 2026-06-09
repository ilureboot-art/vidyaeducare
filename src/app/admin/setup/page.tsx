'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDb, useAuthService } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Shield, RefreshCcw, AlertTriangle, ExternalLink, Database, Info, Activity } from 'lucide-react';
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
  const [studentStatus, setStudentStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [isDatabaseMissing, setIsDatabaseMissing] = useState(false);
  const [currentIdentity, setCurrentIdentity] = useState<{ email: string | null; uid: string | null }>({ email: null, uid: null });

  const targetProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const targetDbId = "vidyaeducaredatabase";

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentIdentity({ email: user?.email || null, uid: user?.uid || null });
    });
    return () => unsub();
  }, [auth]);

  const logProgress = (msg: string) => {
      setProgressLog(prev => [...prev.slice(-4), msg]);
  };

  const ensureRecords = async (uid: string, type: 'admin' | 'student') => {
    if (!db || !auth || !auth.currentUser) throw new Error("Authentication session lost during sync.");
    
    logProgress("Performing identity handshake...");
    await auth.currentUser.getIdToken(true);

    const batch = writeBatch(db);
    const userDocRef = doc(db, "users", uid);
    const walletDocRef = doc(db, "wallets", uid);
    const adminDocRef = doc(db, "admins", uid);

    logProgress(`Mapping records for ${type}...`);

    batch.set(userDocRef, {
      id: uid,
      name: type === 'admin' ? HEAD_ADMIN_NAME : TEST_USER_NAME,
      email: type === 'admin' ? HEAD_ADMIN_EMAIL : TEST_USER_EMAIL,
      phone: type === 'admin' ? HEAD_ADMIN_PHONE : "0000000000",
      joinDate: new Date().toISOString(),
      status: "Active",
    }, { merge: true });

    batch.set(walletDocRef, {
      balance: type === 'admin' ? 0 : 1000,
      coins: 100,
      referralCode: type === 'admin' ? 'HEADADMIN' : `REF${uid.slice(0, 6).toUpperCase()}`
    }, { merge: true });

    if (type === 'admin') {
      batch.set(adminDocRef, {
        name: HEAD_ADMIN_NAME, 
        email: HEAD_ADMIN_EMAIL, 
        phone: HEAD_ADMIN_PHONE,
        role: "Head Admin", 
        status: "Active", 
        joinDate: new Date().toISOString(),
      }, { merge: true });
    } else {
      batch.delete(adminDocRef);
    }

    logProgress("Committing transaction...");
    return batch.commit();
  };

  const handleError = (error: any, target: 'admin' | 'student') => {
    console.error(`Sync Error (${target}):`, error);
    const msg = error.message || "An unexpected error occurred.";
    setErrorMessage(msg);
    if (target === 'admin') setStatus('error');
    else setStudentStatus('error');
    logProgress(`ERROR: ${msg.slice(0, 30)}...`);
  };

  const syncAdmin = async () => {
    if (!db || !auth) return;
    setStatus('loading');
    setProgressLog(["Initializing Admin Sync..."]);
    
    try {
        logProgress("Clearing stale sessions...");
        await signOut(auth);

        let uid = '';
        logProgress("Authenticating admin@vidyaeducare.com...");
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, HEAD_ADMIN_EMAIL, HEAD_ADMIN_PASSWORD);
            uid = userCredential.user.uid;
        } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
                const signInRes = await signInWithEmailAndPassword(auth, HEAD_ADMIN_EMAIL, HEAD_ADMIN_PASSWORD);
                uid = signInRes.user.uid;
            } else throw e;
        }

        logProgress("Identity Handshake: Refreshing Claims...");
        await auth.currentUser?.getIdToken(true);

        logProgress("Propagating permissions (20s wait)...");
        for (let i = 1; i <= 4; i++) {
            await new Promise(r => setTimeout(r, 5000));
            await auth.currentUser?.getIdToken(true);
            logProgress(`Sync heart-beat ${i}/4...`);
        }
        
        await ensureRecords(uid, 'admin');
        
        if (typeof window !== 'undefined') {
            sessionStorage.clear();
            localStorage.clear();
        }
        
        setStatus('success');
        logProgress("SYNC COMPLETE: Admin profile verified.");
        toast({ title: "Bootstrap Complete", description: "Admin identity synced." });
    } catch (error: any) {
        handleError(error, 'admin');
    }
  };

  const syncStudent = async () => {
    if (!db || !auth) return;
    setStudentStatus('loading');
    setProgressLog(["Initializing Student Sync..."]);
    
    try {
        await signOut(auth);

        let uid = '';
        logProgress("Authenticating student@vidyaeducare.com...");
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, TEST_USER_EMAIL, TEST_USER_PASSWORD);
            uid = userCredential.user.uid;
        } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
                const signInRes = await signInWithEmailAndPassword(auth, TEST_USER_EMAIL, TEST_USER_PASSWORD);
                uid = signInRes.user.uid;
            } else throw e;
        }

        logProgress("Propagating permissions (20s wait)...");
        for (let i = 1; i <= 4; i++) {
            await new Promise(r => setTimeout(r, 5000));
            await auth.currentUser?.getIdToken(true);
            logProgress(`Sync heart-beat ${i}/4...`);
        }
        
        await ensureRecords(uid, 'student');
        
        if (typeof window !== 'undefined') {
            sessionStorage.clear();
            localStorage.clear();
        }

        setStudentStatus('success');
        logProgress("SYNC COMPLETE: Student profile verified.");
        toast({ title: "Student Synced", description: "Test profile initialized." });
    } catch (error: any) {
        handleError(error, 'student');
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-black flex items-center justify-center gap-2 text-primary tracking-tighter">
            <Shield className="w-6 h-6" /> SYSTEM INITIALIZATION
          </CardTitle>
          <CardDescription>
            Bypassing security locks to map master identities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-2">
              <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                  <Database size={12}/> Global Registry Targeting
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="text-muted-foreground">Target DB:</div>
                  <div className="font-bold">{targetDbId}</div>
                  <div className="text-muted-foreground">Active Session:</div>
                  <div className="font-bold truncate text-primary">{currentIdentity.email || 'UNAUTHENTICATED'}</div>
                  <div className="text-muted-foreground">Active UID:</div>
                  <div className="font-bold truncate text-primary">{currentIdentity.uid || 'NONE'}</div>
              </div>
          </div>

          <div className="bg-black/90 p-4 rounded-xl border border-white/10 space-y-1">
              <p className="text-[9px] font-bold text-white/50 uppercase flex items-center gap-2">
                  <Activity size={10}/> Real-time Sync Log
              </p>
              <div className="space-y-1 min-h-[80px]">
                  {progressLog.length > 0 ? progressLog.map((log, i) => (
                      <p key={i} className="text-[10px] font-mono text-green-400 animate-in fade-in slide-in-from-left-2">> {log}</p>
                  )) : (
                      <p className="text-[10px] font-mono text-white/30 italic">Awaiting action...</p>
                  )}
              </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground border-b pb-2">Step 1: Admin Authority</h3>
            {status === 'success' ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-black text-sm uppercase">Admin Profile Synced</span>
                    </div>
                </div>
            ) : (
                <Button className="w-full py-7 text-lg font-black shadow-xl" onClick={syncAdmin} disabled={status === 'loading' || studentStatus === 'loading'}>
                    {status === 'loading' ? (
                        <div className="flex flex-col items-center">
                            <Loader2 className="animate-spin mb-1" />
                            <span className="text-[10px]">SYNCING (20S HANDSHAKE)...</span>
                        </div>
                    ) : (
                        <><Shield className="mr-2 h-5 w-5" /> SYNC ADMIN PROFILE</>
                    )}
                </Button>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t">
            <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground border-b pb-2">Step 2: Mock Environment</h3>
            {studentStatus === 'success' ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-black text-sm uppercase">Student Profile Synced</span>
                    </div>
                </div>
            ) : (
                <Button variant="secondary" className="w-full py-7 font-black shadow-lg" onClick={syncStudent} disabled={studentStatus === 'loading' || status === 'loading'}>
                    {studentStatus === 'loading' ? (
                        <div className="flex flex-col items-center">
                            <Loader2 className="animate-spin mb-1" />
                            <span className="text-[10px]">SYNCING (20S HANDSHAKE)...</span>
                        </div>
                    ) : (
                        <><RefreshCcw className="mr-2 h-4 w-4" /> SYNC TEST STUDENT</>
                    )}
                </Button>
            )}
          </div>

          {(status === 'success' && studentStatus === 'success') && (
              <div className="pt-4 animate-in zoom-in duration-300">
                  <Button className="w-full py-8 text-xl font-black bg-accent hover:bg-accent/90 shadow-2xl" onClick={() => router.push('/admin/login')}>
                      ENTER DASHBOARD <ExternalLink className="ml-2 h-5 w-5"/>
                  </Button>
                  <p className="text-center text-[10px] text-muted-foreground mt-4 italic font-bold">Both master identities are verified and mapped to {targetDbId}.</p>
              </div>
          )}
        </CardContent>
        <CardFooter className="bg-primary/5 py-4 border-t justify-center gap-2">
            <Info size={10} className="text-muted-foreground"/>
            <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground italic">Target Instance: {targetDbId}</p>
        </CardFooter>
      </Card>
    </div>
  );
}