'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDb, useAuthService } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Shield, Database, Activity, Info, ExternalLink, Timer, AlertCircle, RefreshCw } from 'lucide-react';
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
  const [countdown, setCountdown] = useState(0);
  const [currentIdentity, setCurrentIdentity] = useState<{ email: string | null; uid: string | null }>({ email: null, uid: null });

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentIdentity({ email: user?.email || null, uid: user?.uid || null });
    });
    return () => unsub();
  }, [auth]);

  const logProgress = (msg: string) => {
      setProgressLog(prev => [...prev.slice(-12), msg]);
  };

  const commitWithRetry = async (uid: string, type: 'admin' | 'student', attempt = 1): Promise<void> => {
    if (!db || !auth || !auth.currentUser) throw new Error("Sync Interrupted: Identity context lost.");
    
    logProgress(`Attempt ${attempt}/20: Committing to vidyaeducaredatabase...`);

    const batch = writeBatch(db);
    const userDocRef = doc(db, "users", uid);
    const walletDocRef = doc(db, "wallets", uid);
    const adminDocRef = doc(db, "admins", uid);

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
    }

    try {
        await batch.commit();
        logProgress(`SUCCESS: Mapping confirmed for ${type.toUpperCase()}.`);
    } catch (e: any) {
        console.warn(`Infrastructure Response: ${e.code} - ${e.message}`);
        
        if (e.code === 'permission-denied' && attempt < 20) {
            logProgress(`RETRY: Refreshing Identity Handshake...`);
            await auth.currentUser.getIdToken(true);
            logProgress(`Waiting 3s for cross-region propagation...`);
            await new Promise(r => setTimeout(r, 3000));
            return commitWithRetry(uid, type, attempt + 1);
        }
        throw e;
    }
  };

  const syncProfile = async (type: 'admin' | 'student') => {
    if (!db || !auth) return;
    const email = type === 'admin' ? HEAD_ADMIN_EMAIL : TEST_USER_EMAIL;
    const password = type === 'admin' ? HEAD_ADMIN_PASSWORD : TEST_USER_PASSWORD;

    if (type === 'admin') setStatus('loading');
    else setStudentStatus('loading');
    
    setProgressLog([`INITIATING ${type.toUpperCase()} SUPREME SYNC...`]);
    
    try {
        logProgress("Clearing stale local state...");
        await signOut(auth);

        let uid = '';
        logProgress(`Requesting Auth for ${email}...`);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            uid = userCredential.user.uid;
            logProgress(`Profile Registered: ${uid}`);
        } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
                const signInRes = await signInWithEmailAndPassword(auth, email, password);
                uid = signInRes.user.uid;
                logProgress(`Profile Linked: ${uid}`);
            } else throw e;
        }

        logProgress("Forcing Identity Handshake...");
        await auth.currentUser?.getIdToken(true);
        
        // Initial wait to let Google's global identity services know about the new session
        logProgress("Cooling down for regional propagation...");
        for (let i = 10; i > 0; i--) {
            setCountdown(i);
            await new Promise(r => setTimeout(r, 1000));
        }
        setCountdown(0);
        
        await commitWithRetry(uid, type);
        
        if (type === 'admin') setStatus('success');
        else setStudentStatus('success');

        logProgress(`MAPPING COMPLETE: ${type.toUpperCase()} verified.`);
        toast({ title: `${type.toUpperCase()} Sync Successful` });
    } catch (error: any) {
        console.error("Critical Failure:", error);
        if (type === 'admin') setStatus('error');
        else setStudentStatus('error');
        logProgress(`ERROR: ${error.message}`);
        toast({ variant: 'destructive', title: "Sync Failed", description: error.message });
    }
  };

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
            <Shield className="w-6 h-6" /> INFRASTRUCTURE SYNC
          </CardTitle>
          <CardDescription>
            Target Database: <span className="font-mono text-xs font-bold">vidyaeducaredatabase</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-2">
              <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                  <Database size={12}/> Connection Details
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="text-muted-foreground">Identity:</div>
                  <div className="font-bold truncate text-primary">{currentIdentity.email || 'Awaiting Sync...'}</div>
                  <div className="text-muted-foreground">Auth UID:</div>
                  <div className="font-bold truncate">{currentIdentity.uid || 'N/A'}</div>
              </div>
          </div>

          <div className="bg-black/90 p-4 rounded-xl border border-white/10 space-y-1">
              <p className="text-[9px] font-bold text-white/50 uppercase flex items-center gap-2">
                  <Activity size={10}/> Sync Console
              </p>
              <div className="space-y-1 min-h-[220px] overflow-hidden">
                  {progressLog.length > 0 ? progressLog.map((log, i) => (
                      <p key={i} className="text-[10px] font-mono text-green-400 animate-in fade-in slide-in-from-left-2">> {log}</p>
                  )) : (
                      <p className="text-[10px] font-mono text-white/30 italic">Select a profile to begin mapping...</p>
                  )}
                  {countdown > 0 && (
                      <div className="flex items-center gap-2 pt-2 text-yellow-400">
                          <Timer size={12} className="animate-pulse" />
                          <span className="text-[10px] font-bold uppercase">Propagation: {countdown}s Left</span>
                      </div>
                  )}
              </div>
          </div>

          <div className="space-y-4">
            {status === 'success' ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                    <CheckCircle className="text-green-600" />
                    <span className="font-black text-xs uppercase text-green-700">Admin Mapping Successful</span>
                </div>
            ) : (
                <Button className="w-full py-10 text-lg font-black shadow-xl" onClick={() => syncProfile('admin')} disabled={status === 'loading' || studentStatus === 'loading'}>
                    {status === 'loading' ? (
                        <div className="flex flex-col items-center">
                            <Loader2 className="animate-spin mb-1" />
                            <span className="text-[10px]">SYNCING (DO NOT CLOSE)...</span>
                        </div>
                    ) : (
                        <><Shield className="mr-2 h-6 w-6" /> SYNC ADMIN PROFILE</>
                    )}
                </Button>
            )}

            {status === 'success' && (
                studentStatus === 'success' ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 p-4 rounded-xl flex items-center gap-3 animate-in fade-in">
                        <CheckCircle className="text-green-600" />
                        <span className="font-black text-xs uppercase text-green-700">Student Mapping Successful</span>
                    </div>
                ) : (
                    <Button variant="secondary" className="w-full py-8 font-black shadow-lg" onClick={() => syncProfile('student')} disabled={studentStatus === 'loading'}>
                         {studentStatus === 'loading' ? (
                            <div className="flex flex-col items-center">
                                <Loader2 className="animate-spin mb-1" />
                                <span className="text-[10px]">VERIFYING STUDENT CLAIM...</span>
                            </div>
                        ) : (
                            <><RefreshCw className="mr-2 h-4 w-4" /> SYNC TEST STUDENT</>
                        )}
                    </Button>
                )
            )}
          </div>

          {(status === 'success' && studentStatus === 'success') && (
              <div className="pt-4 animate-in zoom-in duration-500">
                  <Button className="w-full py-8 text-xl font-black bg-accent hover:bg-accent/90 shadow-2xl" onClick={handleEnterDashboard}>
                      ENTER DASHBOARD <ExternalLink className="ml-2 h-5 w-5"/>
                  </Button>
              </div>
          )}
        </CardContent>
        <CardFooter className="bg-primary/5 py-4 border-t justify-center gap-2">
            <Info size={10} className="text-muted-foreground"/>
            <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground italic text-center">Infrastructure Status: Target Named Database Ready</p>
        </CardFooter>
      </Card>
    </div>
  );
}