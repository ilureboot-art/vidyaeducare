'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDb, useAuthService } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Shield, RefreshCcw, Database, Activity, Info, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [currentIdentity, setCurrentIdentity] = useState<{ email: string | null; uid: string | null }>({ email: null, uid: null });

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentIdentity({ email: user?.email || null, uid: user?.uid || null });
    });
    return () => unsub();
  }, [auth]);

  const logProgress = (msg: string) => {
      setProgressLog(prev => [...prev.slice(-6), msg]);
  };

  const ensureRecords = async (uid: string, type: 'admin' | 'student') => {
    if (!db || !auth || !auth.currentUser) throw new Error("Sync Interrupted: Identity Lost.");
    
    // Final Token Refresh
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

    logProgress("Committing global registry write...");
    return batch.commit();
  };

  const syncAdmin = async () => {
    if (!db || !auth) return;
    setStatus('loading');
    setProgressLog(["Initiating Bootstrap..."]);
    
    try {
        await signOut(auth);
        logProgress("Session cleared.");

        let uid = '';
        logProgress("Authenticating credentials...");
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, HEAD_ADMIN_EMAIL, HEAD_ADMIN_PASSWORD);
            uid = userCredential.user.uid;
        } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
                const signInRes = await signInWithEmailAndPassword(auth, HEAD_ADMIN_EMAIL, HEAD_ADMIN_PASSWORD);
                uid = signInRes.user.uid;
            } else throw e;
        }

        logProgress("REFRESHING TOKENS (15s MANDATORY WAIT)...");
        // Force refresh loop to bypass eventual consistency
        for (let i = 1; i <= 3; i++) {
            await new Promise(r => setTimeout(r, 5000));
            await auth.currentUser?.getIdToken(true);
            logProgress(`Propagation Sync: Heartbeat ${i}/3...`);
        }
        
        await ensureRecords(uid, 'admin');
        
        setStatus('success');
        logProgress("SYNC COMPLETE: Admin authority established.");
        toast({ title: "Bootstrap Successful" });
    } catch (error: any) {
        console.error("Sync Error:", error);
        setStatus('error');
        logProgress(`FAILURE: ${error.message}`);
    }
  };

  const syncStudent = async () => {
    if (!db || !auth) return;
    setStudentStatus('loading');
    setProgressLog(["Initiating Student Sync..."]);
    
    try {
        await signOut(auth);

        let uid = '';
        logProgress("Authenticating student profile...");
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, TEST_USER_EMAIL, TEST_USER_PASSWORD);
            uid = userCredential.user.uid;
        } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
                const signInRes = await signInWithEmailAndPassword(auth, TEST_USER_EMAIL, TEST_USER_PASSWORD);
                uid = signInRes.user.uid;
            } else throw e;
        }

        logProgress("REFRESHING TOKENS (15s MANDATORY WAIT)...");
        for (let i = 1; i <= 3; i++) {
            await new Promise(r => setTimeout(r, 5000));
            await auth.currentUser?.getIdToken(true);
            logProgress(`Student Sync: Heartbeat ${i}/3...`);
        }
        
        await ensureRecords(uid, 'student');
        setStudentStatus('success');
        logProgress("SYNC COMPLETE: Mock student environment ready.");
    } catch (error: any) {
        console.error("Student Sync Error:", error);
        setStudentStatus('error');
        logProgress(`FAILURE: ${error.message}`);
    }
  }

  const handleEnterDashboard = () => {
      sessionStorage.clear();
      localStorage.clear();
      router.push('/admin/login');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-black flex items-center justify-center gap-2 text-primary tracking-tighter uppercase italic">
            <Shield className="w-6 h-6" /> System Initialization
          </CardTitle>
          <CardDescription>
            Bypassing eventually-consistent locks to map master identities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-2">
              <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                  <Database size={12}/> Target Configuration
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="text-muted-foreground">Database:</div>
                  <div className="font-bold">vidyaeducaredatabase</div>
                  <div className="text-muted-foreground">Current Auth:</div>
                  <div className="font-bold truncate text-primary">{currentIdentity.email || 'None'}</div>
                  <div className="text-muted-foreground">Current UID:</div>
                  <div className="font-bold truncate text-primary">{currentIdentity.uid || 'None'}</div>
              </div>
          </div>

          <div className="bg-black/90 p-4 rounded-xl border border-white/10 space-y-1">
              <p className="text-[9px] font-bold text-white/50 uppercase flex items-center gap-2">
                  <Activity size={10}/> Sync Console
              </p>
              <div className="space-y-1 min-h-[120px]">
                  {progressLog.length > 0 ? progressLog.map((log, i) => (
                      <p key={i} className="text-[10px] font-mono text-green-400 animate-in fade-in slide-in-from-left-2">> {log}</p>
                  )) : (
                      <p className="text-[10px] font-mono text-white/30 italic">System Idle. Awaiting Authorization...</p>
                  )}
              </div>
          </div>

          <div className="space-y-4">
            {status === 'success' ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 p-4 rounded-xl flex items-center gap-3">
                    <CheckCircle className="text-green-600" />
                    <span className="font-black text-xs uppercase text-green-700">Admin Synced Successfully</span>
                </div>
            ) : (
                <Button className="w-full py-8 text-lg font-black shadow-xl" onClick={syncAdmin} disabled={status === 'loading' || studentStatus === 'loading'}>
                    {status === 'loading' ? (
                        <div className="flex flex-col items-center">
                            <Loader2 className="animate-spin mb-1" />
                            <span className="text-[10px]">SYNCING (15S WAIT)...</span>
                        </div>
                    ) : (
                        <><Shield className="mr-2 h-5 w-5" /> SYNC ADMIN PROFILE</>
                    )}
                </Button>
            )}

            {status === 'success' && (
                studentStatus === 'success' ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 p-4 rounded-xl flex items-center gap-3 animate-in fade-in">
                        <CheckCircle className="text-green-600" />
                        <span className="font-black text-xs uppercase text-green-700">Student Synced Successfully</span>
                    </div>
                ) : (
                    <Button variant="secondary" className="w-full py-8 font-black shadow-lg" onClick={syncStudent} disabled={studentStatus === 'loading'}>
                         {studentStatus === 'loading' ? (
                            <div className="flex flex-col items-center">
                                <Loader2 className="animate-spin mb-1" />
                                <span className="text-[10px]">SYNCING (15S WAIT)...</span>
                            </div>
                        ) : (
                            <><RefreshCcw className="mr-2 h-4 w-4" /> SYNC TEST STUDENT</>
                        )}
                    </Button>
                )
            )}
          </div>

          {(status === 'success' && studentStatus === 'success') && (
              <div className="pt-4 animate-in zoom-in">
                  <Button className="w-full py-8 text-xl font-black bg-accent hover:bg-accent/90 shadow-2xl" onClick={handleEnterDashboard}>
                      ENTER DASHBOARD <ExternalLink className="ml-2 h-5 w-5"/>
                  </Button>
              </div>
          )}
        </CardContent>
        <CardFooter className="bg-primary/5 py-4 border-t justify-center gap-2">
            <Info size={10} className="text-muted-foreground"/>
            <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground italic">Target: vidyaeducaredatabase</p>
        </CardFooter>
      </Card>
    </div>
  );
}